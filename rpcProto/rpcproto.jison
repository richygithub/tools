
/* description: Parses and executes mathematical expressions. */
%{
    class Node{
        constructor(){
            this.type = 0;
            this.name = "";
        }
        genCode(){

        }
        
    }


   class NodeAssign {
        constructor(type,name,value,array){
            this.type = type;
            this.name = name;
            this.value = value;
            this.array = array;
        }
        genCode(){
            let str=''
            let type = this.type;
            if( !!userDefines[type] ){
                type = userDefines[type].getClassId();
            }
            if(this.array){
                str = `${type} ${this.name}[] ;`
            }else{
                str = `${type} ${this.name} ;`
            }
            return str;

        }
    }
    class NodeMessageBody{
        constructor(){
            this.node=[ ];
        }
        addNode(node){
            this.node.push( node );
        }
        genCode(){
           let str = ''
           this.node.forEach((node)=>{
               if( node instanceof NodeClass ){

               }else{
                    str+=node.genCode();
               }
           })
           return str;
        }
        setParent(parent){
            if( !!parent){
                this.node.forEach((node)=>{
                    if( !!node.setParent ){
                        node.setParent(parent);
                    }
                    
                })
 
            }
        }

    }

    class NodeArrayType{
        constructor(type,isBuffer){
            this.type = type;
            this.isBuffer = isBuffer;
        }

    }

    class NodeParam{
        constructor(type,id,isArray){
            this.isArray = isArray;
            this.type = type;
            this.id = id;
        } 
    }

    class NodeVarDefine{
        constructor(node){
            this.node=node;
        }
    }

    class NodeClass{
        constructor(id){
            this.id = id;
            this.child=[] 
        } 
        addNode( varDefine){
            this.child.push(varDefine);
        }
    }

    class NodeService{
        constructor(id){
            this.id = id;
            this.child = []
        }
        addNode(node){
            this.child.push(node);
        }
    }



    class NodeParams{
        constructor(){
            this.child=[];
        }
        addNode( paramNode){
            this.child.push(paramNode);
        }
    }
    
    class NodeReturn{
        constructor(type){
            this.type = type;
        }
    }

    class NodeFunction{
        constructor(id,params,returnValue){
            this.id = id;
            this.params = params;
            this.returnValue = returnValue;
        }
    }

    class NodeRemote{
        constructor(){
            this.child = [];
        }
        addNode( nodeFunc){
           this.child.push(nodeFunc);
        }
        
    }

    class NodeHandler{
        constructor(){
            this.child = [];
        }
        addNode( nodeFunc){
           this.child.push(nodeFunc);
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
    

  %}


/* lexical grammar */
%lex
%%
\s+                   /* skip whitespace */

"int32"\b               {console.log(".....int32.....",yytext); return 'TYPE'}  
"int64"\b               return 'TYPE'  
"string"\b              return 'TYPE'  
"float"\b               return 'TYPE'  
"bool"\b                return 'TYPE'  

"Array"\b               return 'ARRAY'
"Buffer"\b              return 'BUFFER'

"service"\b             {yytext=new NodeService();return 'Service'}
"remote"\b              return 'Remote'
"handler"\b             return 'Handler'
"class"\b               {return 'Class'}
"namespace"\b           return "Namespace"

[={}()<>,:;,]           {return yytext}
 
[a-zA-Z]+"."[a-zA-Z]+   {return 'TYPE'}
[a-zA-Z]+[0-9]*         { return 'ID'}
[0-9]+\b                {return 'INT';}
[0-9]+("."[0-9]+)?\b    return 'NUMBER'
<<EOF>>                 return 'EOF'
.                       return 'INVALID'


/lex

/* operator associations and precedence */

%left '=' '+' '-'
%left '*' '/'
%left '^'
%right '!'
%right '%'
%left UMINUS

%start expressions

%% /* language grammar */



ArrayType: BUFFER                   {$$=new NodeArrayType(null,true);console.log("param:",$1)}
    | ARRAY "<" TYPE ">"            {$$=new NodeArrayType($3,false); console.log("param:",$1,$3)}
    | ARRAY "<" ID ">"              {$$=new NodeArrayType($3,false); console.log("param:",$1,$3)}
    | BUFFER "<" TYPE ">"           {$$=new NodeArrayType($3,true) ;console.log("param:",$1,$3)}
    | BUFFER "<" ID ">"             {$$=new NodeArrayType($3,true); console.log("param:",$1,$3)}
    ;

param:TYPE ID                       {$$=new NodeParam($1,$2); console.log("param:",$1,$2)}
    | ID ID                         {$$=new NodeParam($1,$2);console.log("param:",$1,$2)}               
    | ArrayType ID                  {$$=new NodeParam($1,$2);console.log("param:",$1,$2)}               
    ;

params:
    |param                          {$$=new NodeParams();$$.addNode($1); }
    |param ","                      {$$=new NodeParams();$$.addNode($1); }
    |params param                   {$$=$1;$$.addNode($2);}
    |params param ","               {$$=$1;$$.addNode($2);}
    ;

return:TYPE                         
    |ArrayType
    |ID
    ;

function: ID "(" params ")" ":" return ";"  {console.log("func0",$1,$3,$6)}
    | ID "(" params ")" ";"             {console.log("func1",$1,$3)}
    ;

functions:function
    |functions function
    ;


remote: Remote "{" "}"
      |Remote "{" functions "}"
      |Remote "{" functions "}" ";"
      ;

handler: Handler "{"   "}"
      |Handler"{" functions "}"
      |Handler "{" functions "}" ";"
      ;

typedefine:param ";"   
          ;

typedefines:typedefine
           |typedefine typedefines
           ;


class:Class ID "{" typedefines "}"
    | Class ID "{" typedefines "}" ";"
    ;




service:Service ID "{" service_body "}" {console.log("..... service....",$1)}
        ;

namespace:Namespace ID ";";

service_body:class
        |handler
        |remote
        |service_body class
        |service_body handler
        |service_body remote
        ;


expressions:
        namespace
        |service
        |EOF
        |expressions service
        |expressions EOF
        ;


/*
declare:param ";"


class
    ：Class ID "{" class_body "}"  { console.log(" find class:",$2);}
    |Class ID "{" class_body "}" ";"  { console.log(" find class:",$2);}
    ;

class_body: 
*/



/*
expressions
    : message 
    | expressions message{ console.log("over...")}
    | expressions EOF { for(let k in unresolved ){
                            if(!!unresolved[k]){
                                console.log("error unresolved symbol.",k);
                                return ;
                            }
                        } ;console.log("eof...");
                        for( let k in userDefines ){
                            console.log( userDefines[k].genCode() );
                        }
                        }

    | EOF {console.log("over..",$$)}
    ;

message: Message ID "{" message_body "}"  { 

                        let classdef = new NodeClass($2,$4);
                        userDefines[$2] = classdef;
                        unresolved[$2] = null;
                        console.log("get msg:",$$); $$=classdef;}; 

message_body: assign {console.log("get body 0",$$,$1);$$=new NodeMessageBody();$$.addNode($1); }
| message {console.log("get inner msg",$$);$$=new NodeMessageBody();$$.addNode($1); }
|message_body assign{console.log("get body 1",$$,$1);$$.addNode($2);}
|message_body message {console.log("get inner msg1",$$);$$.addNode($2);};

assign: TYPE ID '=' INT ";" { console.log("get assign.",$$);$$ = new NodeAssign($1,$2,$4,false)} 
        |ID ID '=' INT ";" { if( !userDefines[$1] ){ 
                                unresolved[$1]=true; }; 
                                console.log("get userDefine.");
                                $$ = new NodeAssign($1,$2,$4,false)
                            } ;
*/