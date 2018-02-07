
const pretty=require('prettier')

class TypeFloat{
    constructor(id){
        this.id = id;
        this.type ="number";
    }
    len(){
        return 4;
    }
    toDefStr(){
        return `${this.id}:number`
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";
        return `${buf}.writeFloatBE(${pre}${this.id},${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=${buf}.readFloatBE(${offset});
                ${offset}+=${this.len()};
        `;
    }

    dval(){
        return 0;
    }

}
class TypeDouble{
    constructor(id){
        this.id = id;
        this.type ="number";
 
    }
    len(){
        return 8;
    }
    toDefStr(){
        return `${this.id}:number`
    }
    dval(){
        return 0;
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";
        return `${buf}.writeDoubleBE(${pre}${this.id},${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=${buf}.readDoubleBE(${offset});
                ${offset}+=${this.len()};
        `;
    }



}


class TypeInt{
    constructor(id){
        this.id = id;
        this.type ="number";
 
    }
    len(){
        return 4;
    }
    toDefStr(){
        return `${this.id}:number`
    }
    dval(){
        return 0;
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";
        return `${buf}.writeInt32BE(${pre}${this.id},${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=${buf}.readInt32BE(${offset});
                ${offset}+=${this.len()};
        `;
    }



}

class TypeLong{
    constructor(id){
        this.id = id;
        this.type ="number";
 
    }
    len(){
        return 8;
    }
    toDefStr(){
        return `${this.id}:number`
    }
    dval(){
        return 0;
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";
        return `${buf}.writeDoubleBE(${pre}${this.id},${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=${buf}.readDoubleBE(${offset});
                ${offset}+=${this.len()};
        `;
    }



}
class TypeBool{
    constructor(id){
        this.id = id;
        this.type ="boolean";
 
    }
    len(){
        return 1;
    }
    toDefStr(){
        return `${this.id}:boolean`
    }
    dval(){
        return false;
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";
        return `${buf}.writeInt8BE(${pre}${this.id},${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=${buf}.readInt8BE(${offset});
                ${offset}+=${this.len()};
        `;
    }



}

class TypeString{
    constructor(id){
        this.id = id;
        this.varLen = true;
        this.headLen = 2;  // max string len:64K
        this.type ="string";
 
    }
    len(own){
        let pre=""
        if(own){
            pre=`${own}.`
        }
        return `Buffer.byteLength(${pre}${this.id})`;
    }
    toDefStr(){
        return `${this.id}:string`
    }
    dval(){
        return `""`;
    }
    serialize(buf,offset,own){
        let pre=own?`${own}.`:"";

        let lenval=`${pre.replace(/\./g,'_')}_${this.id}_len`;

        let str = `
        let ${lenval} = ${this.len(own)};
        ${buf}.writeUInt16BE(${lenval},${offset});
                ${offset}+=${this.headLen};
        `;
        str +=`${buf}.write(${pre}${this.id},${offset});
        ${offset}+=${lenval};
        `
        return str;
    }
    deserialize(buf,offset,pre){
//        let lenval=`${pre.replace(/\./g,'_')}_${this.id}_len`
        let lenval=`_${this.id}_len`
        let str = `
        let ${lenval} = ${buf}.readUInt16BE(${offset});
        ${offset}+=${this.headLen};
        ${pre}${this.id}=${buf}.toString('utf8',${offset},${offset}+${lenval});
        ${offset}+=${lenval};
        `
        return str;        

    }



}

class TypeUser{
    constructor(type,id){
        this.type = type;
        this.id = id;
        this.headLen=4;
    }
    len(own){
        if( this.type.varLen ){
//            return `${this.type}.len(${this.id})`;
        }else{
//            return `${this.type}.length`;
        }
        let pre=""
        if(own){
            pre=`${own}.`
        }

        return `${this.type}.len(${pre}${this.id})`;
    }
    toDefStr(){
        return `${this.id}:${this.type}`
    }
    dval(){
        return null;
    }


}

class TypePB{
    constructor(type,id){
        this.type = type;
        this.id = id;
        this.varLen = true;
        this.headLen=4;
    }
    len(){
        return `_${this.id}Buf.length`;
    }
    toDefStr(){
        return `${this.id}:${this.type}`
    }
    dval(){
        return null;
    }



}

class TypeBuffer{
    constructor(type,id){
        this.id = id;
        this.type = type;
        this.headLen=4;
    }
    len(){
        return `${this.id}.length`;
    }
    toDefStr(){
        if( !!this.id ){
            return `${this.id}:Buffer`;
        }else{
            return "Buffer"
        }
    }
    dval(){
        return null;
    }


}
class TypeArray{
    constructor(type,id){
        this.eleType = type;

        this.type= `Array<${this.eleType.type}>`;  // 

        console.log("type?");
        this.id = id ;
        this.headLen=4;
    }
    len(own){
        if( this.type.varLen ){
            return `not support var-len element in array. please use protobuf.`;
        }else{
            let pre="";
            if( !!own ){
                pre=`${own}.`
            }

            return `${pre}${this.id}.length*${this.eleType.len("msg")}`
        }
    }
    toDefStr(){
        return `${this.id}:${this.type}`
    }
    dval(){
        return null;
    }



}






class NodeVarDefine{
    constructor(node){
        this.node=node;
    }
}


function rtrim(str,ch){
    return str.endsWith(ch)?str.substr(0,str.length-1):str;
}

function genLenStr(typeArray,own) {
    let lenStr = typeArray.reduce((str, cur) => {
        if (!!cur.headLen) {
            return str += `(${cur.headLen}+${cur.len(own)})+`;
        } else {
            return str += `${cur.len(own)}+`;
        }
    }, "")
    return rtrim(lenStr, "+");
}
function genParamDef(typeArray,own){
    let paramDefine = typeArray.reduce((str, cur) => {
        return str += `${cur.toDefStr()},`;
    }, "")
    paramDefine = rtrim(paramDefine, ",");
    return paramDefine;

}

class NodeClass{
    constructor(id){
        this.id = id;
        this.child=[] 
    } 
    addNode( varDefine){
        this.child.push(varDefine);
    }
    toDefStr(){
        let varDefine = this.child.reduce( (str,cur)=>{
            return str+=`${cur.toDefStr()};`;
        },"")

        let paramDefine = this.child.reduce( (str,cur)=>{
            return str+=`${cur.toDefStr()},`;
        },"")
        paramDefine = rtrim(paramDefine,",");

        let ctorDefine = this.child.reduce( (str,cur)=>{
            return str+=`${cur.toDefStr()}=${cur.dval()},`;
        },"")
        ctorDefine = rtrim(ctorDefine,",");


        let assign = this.child.reduce( (str,cur)=>{
            return str+=`this.${cur.id}=${cur.id};`
        },"")

        let lenStr = this.child.reduce( (str,cur)=>{
            if(!!cur.headLen){
                return str+=`(${cur.headLen}+${cur.len("msg")})+`;
            }else{
                return str+=`${cur.len("msg")}+`;
            }
        },"")
        lenStr=rtrim(lenStr,"+");

        let bVarLen = false;
        this.child.forEach( type=>bVarLen|=type.varLen );


        let str=`class ${this.id}{
            ${varDefine}
            constructor(${ctorDefine}){
                ${assign}
            }
            static varLen:boolean = ${!!bVarLen?"true":"false"};
            static len(msg:${this.id}){
                return ${lenStr};
            }
        }`
        return str;

    }
}

class NodeService{
    constructor(){
        this.id=""
        this.child = []
    }
    addNode(node){
        this.child.push(node);
    }
    setId(id){
        this.id = id;
    }
}

 



class NodeFunction{
    constructor(){
        this.id = null;
        this.params = [];
        this.returnValue = new TypeUser('null');
    }

    addParam(param){
        this.params.push(param);
    }
    
    genHeplerClass(parent){

        let paramDefine = genParamDef(this.params);

        let lenstr = genLenStr( this.params );

        let ss = this.params.reduce((str,cur)=>{
            return str+= `${cur.serialize("_buf","_offset")}`
        },"") 

        let className=`Rpc_${this.id}`
        
        let reqParamClass = "";
        if( this.params.length == 0){

        }if( this.params.length == 1){
            reqParamClass = this.params[0].type;
        }else{
            let reqClassName = `${className}_Param`;


            reqParamClass = `class ${reqParamClass}{

            }`

        }


        let dss = this.params.reduce((str,cur)=>{
            return str+= `${cur.deserialize("_buf","_offset","let ")}`
        },"") 

        let head = `type ${this.id}HandlerRet = Promise<[${this.returnValue.type},Error]>;`;
        head+=`type ${this.id}Handler =(${paramDefine})=>${this.id}HandlerRet;`;


        let classDef = `class ${className}{
            //static id:number = parent.count; 


            static serializeReq( ${paramDefine} ):Buffer {
                let _buflen = ${lenstr};
                let _buf=Buffer.alloc(_buflen);
                let _offset=0;
                ${ss}

                return _buf;
            }
            static processReq(data:Buffer,handler:${this.id}Handler):${this.id}HandlerRet{
                let _buf=data;
                let _offset=0;
                ${dss}
                return handler( ${  this.params.reduce( (str,cur)=>{
                    return str+= `${cur.id},`
                },"").replace(/,$/g,'') } );

            }

            static serializeReply(${this.returnValue.toDefStr()}):Buffer{
                let _buflen = ${genLenStr( [this.returnValue] )};
                let _buf = Buffer.alloc(_buflen);
                let _offset = 0;
                ${this.returnValue.serialize("_buf","_offset")};
                return _buf;
            }
            static deserializeReply(data:Buffer){
                let _buf=data;
                let _offset=0;
                ${this.returnValue.deserialize("_buf","_offset","let ")};
                return ${this.returnValue.id};
            }

        }`
        return head+classDef;
 
    }

    genParamDef(){
        let paramDefine = this.params.reduce( (str,cur)=>{
            return str+=`${cur.toDefStr()},`;
        },"")
        return rtrim(paramDefine,",");
    }
    genParamCall(){
        let paramDefine = this.params.reduce( (str,cur)=>{
            return str+=`${cur.id},`;
        },"")
        return rtrim(paramDefine,",");
    }


    genStub(className){
        let str="";
        let returnStr=""
        let returnType="null"
        if( !! this.returnValue ){
            returnType = `${this.returnValue.type}`
            returnStr=`:Promise<[${returnType},Error]>)`;
        }

        let paramDefine = this.genParamDef();
        let paramCall = this.genParamCall();

        str=`${this.id}(${paramDefine})${returnStr}{
            let self = this;
            return self.client.req(${className}.id,${className}.serializeReq(${paramCall}),${className}.deserializeReply)
            as Promise<[${returnType},Error]>;
        }`;


    }
}

class NodeRpc{
    constructor(){
        this.id="";
        this.child=[];
        this.type="";
    }
    addNode(node){
        this.child.push(node);
    }
    setType(type){
        this.type = type;
    }
    setId(id){
        this.id = id ;
    }
    genStub(parent){

        let str=`class ${parent.id}${this.type}{
            private client:RpcClient;
            constructor(client:RpcClient){
                this.client = client;
            }

         }`

    }

}



class NodeRoot{
    constructor(){
        this.id="";
        this.child=[];
    }
    addNode(node){
        this.child.push(node)
    }
    setId(id){
        this.id = id;
    }
}




class NodeProto{
   constructor(){
       this.node = []
   } 
   addNode(node){
       this.node.push(node);
   }
   genCode(){
       let str = ''
       this.node.forEach((node)=>{
           str+=node.genCode();
       })
       return str;
   }
}
let userDefines={

}
let unresolved = {

}

/*
class Player{
    int id;
    string acc;
}
class Enter{
    int id;
    string name;
    Array<int> path;
}
*/

let v1 = new TypeInt("id");
let v2 = new TypeString("name");
let v3 = new TypeDouble("price");
let v4 = new TypeUser("Player","acc");


let func = new NodeFunction();
func.id="enter";
func.addParam(v1);
func.addParam(v2);
func.addParam(v3);
func.returnValue = v2;

let funcstr=  func.genHeplerClass(); 


console.log(funcstr );
let prettyFuncstr= pretty.format(funcstr,{parser:"typescript"});
const fs=require('fs');
fs.writeFileSync("enter.ts",prettyFuncstr);
//console.log("str is:",pretty.format(funcstr,{parser:"typescript"}) );

let v5 = new TypeArray( new TypeInt(),"path" );

let enter = new NodeClass("Enter");
enter.addNode(v1);
enter.addNode(v2);

enter.addNode(v3);
enter.addNode(v4);
enter.addNode(v5);



let str = enter.toDefStr();

//console.log("str:",str);
//console.log("str is:",pretty.format(str,{parser:"typescript"}) );
