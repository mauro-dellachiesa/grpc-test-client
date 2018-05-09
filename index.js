import express, { Router } from "express";
import serveStatic  from 'serve-static';
import fileUpload from "express-fileupload";
import GrpcClient from "./grpc-client";
//init Express
var app = express();

app.use(fileUpload());

//init Express Router
var router = Router();
var port = process.env.PORT || 80;

router.post('/parseProto', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
    const protoFile = req.files.protoFile;
    const grpcSchema = new GrpcClient({}).getSchema(protoFile.data);
    res.json({
        schema: grpcSchema,
        proto: protoFile.data.toString()
    });
});

router.get('/executeMethod', function(req, res) {
        
    const methodExecution = new GrpcClient({
        host: '127.0.0.1:9191'
    }).executeMethod({
        proto: req.query.proto,
        service: req.query.service,
        method: req.query.method,
        package: req.query.package,
        parameters: req.query.parameters || {}
    });

    methodExecution.then(function(result) {
        res.json(result);
    })
    .catch(function(err) {
        console.error(err);
        res.statusCode = 400;
        res.json({result: err});
    });
    
      
  });

//connect path to router
app.use("/", router);

//add middleware for static content
app.use(serveStatic('static'))
var server = app.listen(port, function () {
    console.log('node.js static and REST server listening on port: ' + port)
})

//if serving static app from another server/port, send CORS headers in response
//{ headers: {
//"Access-Control-Allow-Origin": "*",
//    "Access-Control-Allow-Headers": "http://localhost:3000",
//    "Access-Control-Allow-Methods": "PUT, GET, POST, DELETE, OPTIONS"
//} }