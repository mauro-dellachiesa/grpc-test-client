$(document).ready(function() {
    let proto = null;
    function buildMethodsTabs(data) {
        let methodsTabs =$("#methodsTabs");
        methodsTabs.empty();

        let ul = $(document.createElement('ul'));
        methodsTabs.append(ul);
        data.services[0].methods.forEach(method => {
            ul.append('<li><a href="#tabs-' + method.name + '">' + method.name + '</a></li>');
            let info = generateMethodInfo(method, data);
            let tabDiv = $(document.createElement('div'));
            tabDiv.attr('id', 'tabs-' + method.name);
            tabDiv.append(info);
            methodsTabs.append(tabDiv);
        });
        methodsTabs.tabs();
    };

    function generateMethodInfo(method, protoDef) {
        let inputType = protoDef.messages.find(function(m) { return m.name === method.input_type;});
        let fieldsDiv = $(document.createElement('div'));
        fieldsDiv.append('Fields:');
        inputType.fields.forEach((field) => {
            fieldsDiv.append(field.name + '(' + field.type + ')');
        });
        let executeBtn = $(document.createElement('button'));
        let responsePre = $(document.createElement('pre'));
        fieldsDiv.append(executeBtn);
        fieldsDiv.append(responsePre);
        executeBtn.click(function() {
            $.ajax('/executeMethod', {
                data: {
                    service: protoDef.services[0].name,
                    method: method.name,
                    proto: proto,
                    package: protoDef.package,
                    parameters: {} // Support for parameters is not ready yet!
                }
            })
            .done(function(result) {
                responsePre.text(JSON.stringify(result, undefined, 4));
                console.log(result);
            });
        });
        executeBtn.html('Execute'); 
        let containerP = $(document.createElement('p'));
        containerP.append(fieldsDiv);       
        return containerP;
    };
	$("#protoFile").uploadFile({
        url:"/parseProto",
        fileName:"protoFile",
        onSuccess:function(files,data,xhr,pd)
            {
                proto = data.proto;
                buildMethodsTabs(data.schema);
            }
        }
    );
});