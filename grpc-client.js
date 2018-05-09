import { credentials, load, Metadata } from "grpc";
import { parse } from "protocol-buffers-schema";
import tempfile from "tempfile";
import { get } from "lodash";
import { writeFileSync, unlink } from "fs";

class GrpcClient {
  constructor(config) {
    if (typeof String.prototype.endsWith !== 'function') {
      String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };
    }
    this.host = config.host || "";
    this.protodir = config.dir || "";
    this.header = config.header || null;
    this.currentCall = null;
    this.log = config.log || console;
    this.serviceName = "";
    this.credentials = config.credentials || credentials.createInsecure();
    return this;
  }
  getSchema(proto) {
    return parse(proto);
  }
  executeMethod(options) {
    const protoFilePath = tempfile('.proto');
    try {
      writeFileSync(protoFilePath, options.proto);
      const loaded = load(protoFilePath);
      var ProtoClass = get(loaded, options.package);
      const startTime = new Date();
      const client = new ProtoClass[options.service](this.host, this.credentials);
      const that = this;
      return new Promise(function (resolve, reject) {
        const injectionLogCb = function (err, result) {
          const endTime = new Date();
          const executeTime = endTime - startTime;
          if (err) {
            const logErr = { type: "grpc_err", path: protoFilePath, func: options.service, headers: that.header, params: options.parameters, errMsg: err, executeTime: executeTime };
            that.log.error(logErr);
            reject(err);
          }
          else {
            const logInfo = { type: "grpc_res", path: protoFilePath, func: options.service, headers: that.header, params: options.parameters, executeTime: executeTime };
            that.log.info(logInfo);
            resolve(result);
          }
        }.bind(this);
        client[options.method](options.parameters, injectionLogCb);
      });
    }
    finally {
      unlink(protoFilePath, () => { console.log('temp file deleted'); });
    }
  }
}
export default GrpcClient;