
const pretty=require('prettier')
const fs=require('fs');
const path=require('path');

let userDefines={

}

let unresolved = {

}

let root = null;

class TypeFloat{
    constructor(id=""){
        this.id = id;
        this.type ="number";
    }
    len(){
        return 4;
    }
    toDefStr(){
        return `${this.id}:number`
    }
    serialize(buf,offset,pre){
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
    constructor(id=""){
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
    serialize(buf,offset,pre){
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
    constructor(id=""){
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
    serialize(buf,offset,pre){
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
    constructor(id=""){
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
    serialize(buf,offset,pre){
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

class TypeVoid{
    constructor(){
        this.id=""
        this.type="void"
    }
    len(){
        return ""
    }
    toDefStr(){
         return ""
    }
    dval(){
        return ""
    }
    serialize(buf,offset,pre){
       return ""
    }
    deserialize(buf,offset,pre){
       return ""
   }

}

class TypeBool{
    constructor(id=""){
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
    serialize(buf,offset,pre){
        return `${buf}.writeInt8(${pre}${this.id}?1:0,${offset});
                ${offset}+=${this.len()};
        `;

    }
    deserialize(buf,offset,pre){
        return `${pre}${this.id}=(${buf}.readInt8(${offset})>0?true:false);
                ${offset}+=${this.len()};
        `;
    }



}

class TypeString{
    constructor(id=""){
        this.id = id;
        this.varLen = true;
        this.headLen = 2;  // max string len:64K
        this.type ="string";
 
    }
    len(pre){
       return `Buffer.byteLength(${pre}${this.id})`;
    }
    toDefStr(){
        return `${this.id}:string`
    }
    dval(){
        return `""`;
    }
    serialize(buf,offset,pre=""){

//        let lenval=`${pre.replace(/\./g,'_')}_${this.id}_len`;
        let lenval=`_${this.id}_len`;
        let str = `
        let ${lenval} = ${this.len(pre)};
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
    constructor(type,id=""){
        this.type = type;
        this.id = id;
        this.headLen=4;
        this._varLen=null;
//        this.varLen = false;//eval(`${type}.varLen`)
    }
    get varLen(){
        if( this._varLen === null ){
            this._varLen = userDefines[this.type].varLen;
        }
    }
    /*
    set varLen(v){
        this._varLen = v;
    }
    */
    len(pre){
        if( this.varLen ){
//            return `${this.type}.len(${this.id})`;
        }else{
//            return `${this.type}.length`;
        }
        return `${this.type}.len(${pre}${this.id})`;
    }
    toDefStr(){
        return `${this.id}:${this.type}`
    }
    dval(){
        return null;
    }
    serialize(buf,offset,pre){
        return `${offset}+=${this.type}.serialize(${pre}${this.id},${buf},${offset});`
    }

    deserialize(buf,offset,pre){
      //  let str=``
       return `
       ${pre}${this.id} = new ${this.type};
       ${offset}+= ${this.type}.deserialize(${pre.replace("let ","")}${this.id},${buf},${offset});`
    }

}

class TypePB{
    constructor(type,id=""){
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
    constructor(type,id=""){
        this.id = id;
        this.type = "Buffer";
        this.headLen=4;
    }
    len(pre){
        return ` (!!${pre}${this.id}?${pre}${this.id}.length:0)`;
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
    serialize(buf,offset,pre=""){

        let lenval=`_${this.id}_len`;

        let str = `
        let ${lenval} = ${this.len(pre)};
        ${buf}.writeUInt32BE(${lenval},${offset});
        ${offset}+=${this.headLen};
 

        if(!!${pre}${this.id}){
            ${buf}.copy(${pre}${this.id},0,${offset});
            ${offset}+=${lenval};
        }

      `;
        return str;
    }
    deserialize(buf,offset,pre=""){
//        let lenval=`${pre.replace(/\./g,'_')}_${this.id}_len`
        let lenval=`_${this.id}_len`
        let str = `
        let ${lenval} = ${buf}.readUInt32BE(${offset});
        ${offset}+=${this.headLen};
        ${pre}${this.id}= Buffer.from(${buf}.buffer,${offset},${lenval});
        ${offset}+=${lenval};
        `
        return str;        

    }




}
class TypeArray{
    constructor(type,id=""){
        this.eleType = type;

        this.type= `Array<${this.eleType.type}>`;  // 

        this.id = id ;
        this.headLen=4;
    }
    len(pre){
        if( this.eleType.varLen ){
            return `(!!${pre}${this.id}?${pre}${this.id}.reduce( (len,ele)=>{
                return len+=${this.eleType.len("ele")}
            },0):0)` ;

        }else{

            return `(!!${pre}${this.id}?${pre}${this.id}.length*${this.eleType.len()}:0)`
        }
    }
    toDefStr(){
        return `${this.id}:${this.type}`
    }
    dval(){
        return null;
    }
    serialize(buf,offset,pre=""){

        let lenval=`_${this.id}_len`;

        let str = `
        let ${lenval} = !!${pre}${this.id}?${pre}${this.id}.length:0;
        ${buf}.writeUInt32BE(${lenval},${offset});
        ${offset}+=${this.headLen};
 
        if( ${lenval}>0){
            for(let idx=0;idx<${lenval};idx++){
                ${this.eleType.serialize(buf,offset,  pre+this.id+"[idx]" )}
            }
        }
       `;
        return str;
    }
    deserialize(buf,offset,pre=""){
//        let lenval=`${pre.replace(/\./g,'_')}_${this.id}_len`
        let lenval=`_${this.id}_len`

        let elename = `${pre.replace("let ","") }${this.id}[idx]`
        let eleDeserial = `${this.eleType.deserialize(buf,offset,  elename )}`;
 
        if( this.eleType instanceof TypeUser ){

            eleDeserial = `${elename} = new ${this.eleType.type};
            ${this.eleType.deserialize(buf,offset, elename )}`;
 
        }

        let str = `
        let ${lenval} = ${buf}.readUInt32BE(${offset});
        ${offset}+=${this.headLen};
        ${pre}${this.id}= new ${this.type}();
        for(let idx=0;idx<${lenval};idx++){
            ${eleDeserial}            
        }
       `
        return str;        

    }




}



function rtrim(str,ch){
    return str.endsWith(ch)?str.substr(0,str.length-1):str;
}

function genLenStr(typeArray,pre="") {
    let lenStr = typeArray.reduce((str, cur) => {
        if (!!cur.headLen) {
            return str += `(${cur.headLen}+${cur.len(pre)})+`;
        } else {
            return str += `${cur.len(pre)}+`;
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

function genParamTran(typeArray,pre=""){
    let paramDefine = typeArray.reduce((str, cur) => {
        return str += `${pre}${cur.id},`;
    }, "")
    paramDefine = rtrim(paramDefine, ",");
    return paramDefine;
}


function genSerialize(typeArray,buf,offset,pre){
    let ss = typeArray.reduce((str,cur)=>{
        return str+= `${cur.serialize(buf,offset,pre)}`
    },"") 
    return ss;
}

function genDeserialize(typeArray,buf,offset,pre){
    let dss = typeArray.reduce((str,cur)=>{
        return str+= `${cur.deserialize(buf,offset,pre)}`
    },"") 
    return dss;
}

class NodeClass{
    constructor(id){
        this._id = id;
        this.child=[] 
        this.varLen=false;

   } 
    get id(){
        return this._id
    }
    set id(id){
        this._id = id;
        if( !!id ){
            userDefines[id] = this;
        }
    }

    addNode( varDefine){
        this.child.push(varDefine);
        this.varLen |= varDefine.varLen;
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
                return str+=`(${cur.headLen}+${cur.len("msg.")})+`;
            }else{
                return str+=`${cur.len("msg.")}+`;
            }
        },"")
        lenStr=rtrim(lenStr,"+");

        let bVarLen = false;
        this.child.forEach( type=>bVarLen|=type.varLen );


        let str=`export class ${this.id}{
            ${varDefine}
            constructor(${ctorDefine}){
                ${assign}
            }
            static varLen:boolean = ${!!bVarLen?"true":"false"};
            static len(msg:${this.id}){
                return ${lenStr};
            }
            static serialize(msg:${this.id},buf:Buffer,offset:number):number{

                let orign = offset;
                ${genSerialize(this.child,"buf","offset","msg.")}
                return offset-orign;
            }
            static deserialize(msg:${this.id},buf:Buffer,offset:number):number{
                let orign = offset;
                ${genDeserialize(this.child,"buf","offset","msg.")}
                return offset - orign;
            }
        }`
        return str;

    }
}

 


function firstLetterUpper (str) {
    return str.charAt(0).toUpperCase()+str.slice(1);
};
class NodeFunction{
    constructor(){
        this.id = null;
        this.params = [];
        this._returnValue =  new TypeVoid();//new TypeUser('null');
        this.helperClass="";
        this.handlerInterface="";
    }

    get returnValue(){
        return this._returnValue;
    }
    set returnValue(v){
        this._returnValue = v;
        if( v instanceof TypeVoid ){
        }else{
            this._returnValue.id = "reply"
        }
    }

    addParam(param){
        this.params.push(param);
    }
    
    rpcClassName(){
        return `Rpc${ firstLetterUpper(this.id)}`
    }

    genRpcCode(serviceId){

//        console.log("genHelpClass sid:",serviceId,this.id);
        let paramDefine = genParamDef(this.params);

        let lenstr = genLenStr( this.params );

        let className=`Rpc${ firstLetterUpper(this.id)}`
        let iName =`I${ firstLetterUpper(this.id)}`


        let head = `
        type ${this.id}HandlerRet = Promise<[${this.returnValue.type},Error]>;`;
        head+=`type ${this.id}Handler =(${paramDefine})=>${this.id}HandlerRet;`;

        let ssreq=``;
        if( this.params.length==0 || (this.params.length==1&& this.params[0] instanceof TypeVoid ) ){
            ssreq= `return null;`
        }else{
            ssreq =`let _buflen = ${lenstr};
                let _buf=Buffer.alloc(_buflen);
                let _offset=0;
                ${genSerialize(this.params,"_buf","_offset","")}

                return _buf; `;
        }

        let ssreply=``;
        if(this.returnValue == null || this.returnValue instanceof TypeVoid ){
            ssreply=`return null;`;
        }else{
            ssreply=`let _buflen = ${genLenStr( [this.returnValue] )};
                let _buf = Buffer.alloc(_buflen);
                let _offset = 0;
                ${this.returnValue.serialize("_buf","_offset","")};
                return _buf;`;
        }

        let interfaceDef = `
        export abstract class ${iName}{
            static id:number = ${serviceId}; 

            abstract handler(${paramDefine}):${this.id}HandlerRet;
           processReq(data:Buffer):${this.id}HandlerRet{
                let _buf=data;
                let _offset=0;
                ${genDeserialize(this.params,"_buf","_offset","let ")}
                return this.handler( ${  this.params.reduce( (str,cur)=>{
                    return str+= `${cur.id},`
                },"").replace(/,$/g,'') } );

            }

            serializeReply(${this.returnValue.toDefStr()}):Buffer{
                ${ssreply}
           }

            static serializeReq( ${paramDefine} ):Buffer {
                ${ssreq}
            }
 
            static deserializeReply(data:Buffer):${this.returnValue.type} {
                let _buf=data;
                let _offset=0;
                ${this.returnValue.deserialize("_buf","_offset","let ")};
                return ${this.returnValue.id};
            }

        }\n`

        let classDef = `import {${iName} } from "./interface";
            import {${Object.keys(userDefines).join()}} from "../type";
            export default class ${className} extends ${iName}{

                service:any;
                constructor(service){
                    super();
                    this.service = service;
                  }
                async handler(${paramDefine}):Promise<[${this.returnValue.type},Error]>{
                    let ret:${this.returnValue.type};
                    //to do . assign to ret.

                    return [ret,null];
                }
            }
            
        `
        return { id:this.id,iname:iName,idef:head+interfaceDef,cname:className,cdef:classDef,stub:this.genStub(iName)  };
        /*
        let implfname=path.join(dir,`${this.id}.ts`);
        if( !fs.exists(implfname) ){
            fs.writeFileSync(implfname,pretty.format(classImpl,{parser:"typescript"}))
        }
        return head+classDef;
        */

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
            returnStr=`:Promise<[${returnType},Error]>`;
        }

        let paramDefine = this.genParamDef();
        let paramCall = this.genParamCall();

        str=`${this.id}(${paramDefine})${returnStr}{
            let self = this;
            return self.client.req(${className}.id,${className}.serializeReq(${paramCall}),${className}.deserializeReply) as Promise<[${returnType},Error]>;
        }`;

        return str;
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
    genRpcName(){
        return this.child.map( cur=>cur.rpcClassName() ).join();
    }

    genRpcCode(){
        return this.child.map( node=>{
            console.log(`type:${this.type},count:${root[this.type+"Count"] }`)
            return node.genRpcCode( root[`${this.type}Count`]++);
        })
    } 

    genRpcClass(dir){
        let genStr = this.child.reduce( (str,cur)=>{
            return str+=cur.genHelpClass(dir);
        },"")
        return genStr;
    }
    genStub(serviceName){
        return this.child.reduce( (str,cur)=>{
            return str+=cur.genStub(serviceName);
        },"")
 
    }

    genHandlerInterface(){
        return this.child.reduce( (str,cur)=>{
            return str+=cur.genHandlerInterface();
        },"")
    }
}


function mkdir(dir) {
    if (dir == null || dir.length <= 0) {
        return null;
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log("mkdir...:", dir);
    return dir;

}

class NodeService{
    constructor(){
        this.id=""
        this.child = []
        this.serviceCount=0;
    }
    addNode(node){
        this.child.push(node);
    }
    setId(id){
        this.id = id;
    }
    genHandler(dir=""){

        this.child.forEach(node => {
            if (node instanceof NodeRpc && node.type == "handler") {
                handlerDir = mkdir(dir, "Handler");
                strHandler = importHead + node.genRpcClass(handlerDir);
            }
        })


    }
    genRpcDir(noderpc,dir=""){
        return path.join(dir,`${noderpc.id}${ firstLetterUpper(noderpc.type)}`) 
    }
    genCode(dir=""){

        let importHead = `${root.genImportStr()};`;

        let remoteDir="";
        let handlerDir="";
        let strHandler="";
        let strRemote="";


        mkdir(dir);


        let stubInfo=[];
        let implFiles=[];

        this.child.forEach( ele=>{
            
            if( ele instanceof NodeRpc ){
                
                let stubAll= `interface Client{
                    req:(serviceId:number, data:Buffer , deserialize:(data:Buffer)=>any )=>Promise<[any,Error]>;
                };
                `;

                let stubDep=[];
                let strInterface=importHead;
                let dirname = `${this.id}${ firstLetterUpper( ele.type ) }`;
                let rpcdir = path.join(dir,dirname); //this.genRpcDir(ele,dir);
                mkdir(rpcdir);
                console.log("...............dir:",dir,ele.type,ele.id);

                let codes = ele.genRpcCode( );
                console.log("codes..",codes.length)

                let stubStr="";
                let rpcType = ele.type;
                codes.forEach(ele => {
                    console.log(`${ele.id},${ele.iname},${ele.cname}`)
//                    strRemote = importHead + node.genRpcClass(remoteDir);
                    strInterface += ele.idef;
                    stubStr += ele.stub;
                    stubDep.push(ele.iname);

                    implFiles.push( { fname:`${dirname}/${ ele.id}`,type:rpcType} );
                    fs.writeFileSync(path.join(rpcdir,`${ele.id}.ts`), pretty.format(ele.cdef,{parser:"typescript"} ) );

                })


                fs.writeFileSync(path.join(rpcdir,`interface.ts`), pretty.format(strInterface,{parser:"typescript"})  );

                stubAll += `

                    export class Stub{
                        private client:Client;
                        constructor(client:Client){
                            this.client = client;
                        }
                        ${stubStr}
                    }`
                console.log("ele change?",ele.type,ele.id);
                stubInfo.push( { id:this.id, str:stubAll,dep:stubDep,dir:dirname,type:ele.type });
            }

        })


        return {stubInfo,implFiles};

    }
    genStub(){
        let str="";
        this.child.forEach( ele=>{
            if( ele instanceof NodeRpc && ele.type=="remote"){
                str+= ele.genStub(this.id);
            }
        })
        
        return `
    namespace ${this.id}{
        export class Stub{
            private client:Client;
            constructor(client:Client){
                this.client = client;
            }
            ${str}
        }
    }`

    }
    genRpc(type){
        let str='';
        let self=this;
        this.child.forEach( ele=>{
            if( ele instanceof NodeRpc && ele.type == type ){
                str+= ele.genRpcClass( );
            }
        })
        return str;
 
    }
    genHandlerInterface(){
        let handlerStr=""
        let remoteStr=""
        this.child.forEach( ele=>{
            if( ele instanceof NodeRpc){
                if( ele.type == "remote"){
                    remoteStr+= ele.genHandlerInterface()+"\n";
                }else if(ele.type == "handler"){
                    handlerStr+= ele.genHandlerInterface()+"\n";
                }

            }
        })

        return { handler:`export interface handler{${handlerStr}}`,
            remote:`export interface remote{${remoteStr}}` }
    }
    genClass(){
        let str='';
        this.child.forEach( ele=>{
            if( ele instanceof NodeClass ){
                str+= ele.toDefStr();
            }
        })
        return str;
    }
}



class NodeRoot{
    constructor(){
        this.id="";
        this.child=[];
        this.serviceCount=0;
        this.remoteCount=0;
        this.handlerCount=0;
        root = this;
        console.log("......... node root......");

    }
    addNode(node){
        this.child.push(node)
    }
    setId(id){
        this.id = id;
    }
    genImportStr(fname="../type"){
       return `import {${Object.keys(userDefines).join()}} from "${fname}";`
 
    }
    genCode(basedir=""){

        let classdef = ''
        for(let key in userDefines ){
            let usertype = userDefines[key];
            classdef+= usertype.toDefStr();
        }

        let dir= path.join(basedir,this.id);
        if( !fs.existsSync(dir) ){
            fs.mkdirSync(dir);
        }


        let typefpath = path.join( dir,`type.ts`);
        fs.writeFileSync( typefpath, classdef);
        console.log("start write type");
        fs.writeFileSync( typefpath,  pretty.format(classdef,{parser:"typescript"}) );




        let rpcImportStr=""
        let rpcDef="";
        let rpcCtor="";


        let stubImportStr=this.genImportStr("./type");
        let stubVarDef="";
        let stubVarAssign="";
        let stubBody="";


        let stubDir = path.join(dir,"stub");
        mkdir(stubDir);



        let serviceImportStr="";
        let serviceAssgin = "";
        let serviceBody="";
        let serviceFname=path.join(dir,"service.ts");




        for(let idx=0;idx<this.child.length;idx++){

            let {stubInfo,implFiles} = this.child[idx].genCode( dir );
            let service = this.child[idx];
             
            stubInfo.forEach( s=>{
               let importStr=`import {${s.dep.join()}} from "../${s.dir}/interface";
               ${this.genImportStr("../type")};
               ` 
               let fname = path.join(stubDir,`${service.id}-${s.type}-stub.ts` );

               fs.writeFileSync( fname,  pretty.format(importStr+s.str,{parser:"typescript"}) );

                if (s.type == "remote") {

                    let stubClass = `${firstLetterUpper(service.id)}Stub`;
                    /*
                    stubBody += s.str;
                    stubVarDef += `${service.id}:${stubClass};`
                    stubVarAssign += `this.${service.id}= new ${stubClass}(client);`

                    stubImportStr += `import {Stub as ${stubClass}} from "./${service.id}-${s.type}-stub";`
                    */

                    let sid = this.child[idx].id;
                    rpcImportStr += `import {Stub as ${stubClass}} from "./${sid}-${s.type}-stub";`
                    rpcDef += `${sid}:${stubClass};`
                    rpcCtor += `this.${sid} = new ${stubClass}(client);`;

                }
           
            })            

            implFiles.forEach( impl=>{
                console.log("process..",impl.fname);
                let expName = impl.fname.replace("/","");
                serviceImportStr+=`import {default as ${expName}} from "./${impl.fname}";`
                serviceAssgin+=`this.${impl.type}[${expName}.id] = new ${expName}( this );`;
            })

        }

        console.log(".... import:", serviceImportStr);
        let rpcStr=`
        ${rpcImportStr}

        interface Client{
            req:(serviceId:number, data:Buffer , deserialize:(data:Buffer)=>any )=>Promise<[any,Error]>;
        };
        export class Rpc{
            ${rpcDef}
            constructor(client:Client){
                ${rpcCtor}
            }
        }`;


        let stubfpath = path.join( stubDir,`stub.ts`);
        fs.writeFileSync( stubfpath, rpcStr);
        console.log("start write stub");
        fs.writeFileSync( stubfpath,  pretty.format(rpcStr,{parser:"typescript"}) );

        serviceBody = `${serviceImportStr}
            class Service{
                remote:Array<any>;
                handler:Array<any>;
                app:any;
                constructor(app){
                    this.app = app;
                    this.remote = new Array();
                    this.handler= new Array();
                    ${serviceAssgin}
                }
                async process(serviceId:number,type:string, data:Buffer) {
                    let h=null;
                    if( type == "remote"){
                        h=this.remote
                    }else if(type == "handler"){
                        h=this.handler;
                    }
                    
                    if( !h || !h[serviceId]){
                        return [null,new Error(\`service invalid.type:\${type},serviceId:\${serviceId}\`)]
                    }
                    let ret = await h[serviceId].processReq(data);
                    if( !!ret[1] ){
                        //error.
                        return ret;
                    }
                    return [ h[serviceId].serializeReply(ret[0]),null ] ;
                }
            
            }
        `
        let sfpath = path.join( dir,`service.ts`);
        fs.writeFileSync( sfpath, serviceBody);
        console.log("start write service");
        fs.writeFileSync( sfpath,  pretty.format(serviceBody,{parser:"typescript"}) );



    }
}




module.exports = {
    NodeClass,
    NodeFunction,
    NodeRpc,
    NodeRoot,
    NodeService,
    TypeArray,
    TypeBool,
    TypeBuffer,
    TypeDouble,
    TypeFloat,
    TypeInt,
    TypeLong,
    TypeString,
    TypeUser,
    TypeVoid,
    TypePB
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
function test() {

    let v1 = new TypeInt("id");
    let v2 = new TypeString("name");
    let v3 = new TypeDouble("price");
    //let v4 = new TypeUser("Player","acc");

    let vb = new TypeBuffer(null, "raw");
    //let va = new TypeArray( new TypeInt(),"intarray" );
    //console.log("str is:",pretty.format(funcstr,{parser:"typescript"}) );

//    let va = new TypeArray(new TypeUser("Enter"), "path");

    let enter = new NodeClass("Enter");
    enter.addNode(v1);
    enter.addNode(v2);

    enter.addNode(v3);
    //enter.addNode(v4);
    enter.addNode(vb);
 //   enter.addNode(va);


    let str = enter.toDefStr();

    fs.writeFileSync("rpcenter.ts", str);


    let rpcStr = pretty.format(str, { parser: "typescript" });
    fs.writeFileSync("rpcenter.ts", rpcStr);


    let func = new NodeFunction();
    let vn = new TypeVoid();

    func.id = "enter";
   // func.addParam(vn);
    
    func.addParam(v2);
    func.addParam(v3);
    func.addParam(vb);
//    func.addParam(va);

    func.returnValue =new TypeInt();

    let funcstr = func.genHelpClass();

    console.log("write unpretty enter.ts");
    fs.writeFileSync("enter.ts", funcstr);

    let prettyFuncstr = pretty.format(funcstr, { parser: "typescript" });
    console.log("write pretty enter.ts:");
    fs.writeFileSync("enter.ts", prettyFuncstr);

}
