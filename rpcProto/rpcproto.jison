
/* description: Parses and executes mathematical expressions. */
%{

const pretty=require('prettier')
const fs=require('fs');

let {
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
}  = require('./rpc.jison.js')

    let importfile="" 

  %}


/* lexical grammar */
%lex

%x comment
%x commentline
%x import

%%
\s+                   /* skip whitespace */

"//"                    this.begin("commentline");
<commentline>\r\n       this.popState();
<commentline>\n         this.popState();
<commentline>.          /*skip all character*/ 

"/*"                    this.begin("comment")
<comment>"*/"           this.popState()
<comment>\s+            /* skip whitespace*/
<comment>.             /*skip all character*/ 



"import"\b              { this.begin("import");console.log("...begin import...") }
<import>\r\n            { this.popState(); console.log("import:",importfile)}
<import>\n              { this.popState(); console.log("import:",importfile)}}
<import>.               importfile += yytext;



"int32"\b               {yytext=new TypeInt() ; return 'TYPE'}  
"int64"\b               {yytext=new TypeLong() ; return 'TYPE'}  
"string"\b               {yytext=new TypeString() ; return 'TYPE'}  
"float"\b               {yytext=new TypeFloat() ; return 'TYPE'}  
"bool"\b               {yytext=new TypeBool() ; return 'TYPE'}  





"Array"\b               return 'ARRAY'
"Buffer"\b              return 'BUFFER'

"service"\b             {return 'Service'}
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



ArrayType: BUFFER                   {$$=new TypeBuffer();console.log("param:",$1)}
    | ARRAY "<" TYPE ">"            {$$=new TypeArray($3); console.log("param:",$1,$3)}
    | ARRAY "<" ID ">"              {$$=new TypeArray(  new TypeUser($3) ); console.log("param:",$1,$3)}
    ;

param:TYPE ID                       {$$=$1;$$.id = $2 ; console.log("param:",$1,$2)}
    | ID ID                         {$$=new TypeUser($1,$2);console.log("param:",$1,$2)}               
    | ArrayType ID                  {$$=$1;$$.id = $2 ; console.log("param:",$1,$2)}               
    ;

funcparams:                         {$$=new NodeFunction()}
    |param                          {$$=new NodeFunction();$$.addParam($1); }
    |param ","                      {$$=new NodeFunction();$$.addParam($1); }
    |funcparams param                   {$$=$1;$$.addParam($2);}
    |funcparams param ","               {$$=$1;$$.addParam($2);}
    ;

return:TYPE                         {$$=$1 } 
    |ArrayType                      {$$=$1 }
    |ID                             {$$=new TypeUser($1); }
    ;

function: ID "(" funcparams ")" ":" return ";"  {$$=$3;$$.id = $1;$$.returnValue = $6;  console.log("func0",$1,$3,$6)}
    | ID "(" funcparams ")" ";"                 {$$=$3;$$.id = $1;$$.returnValue = new TypeVoid();console.log("func1",$1,$3)}
    ;

functions:function              {$$=new NodeRpc(); $$.addNode($1) }
    |functions function         {$$=$1;$$.addNode($2) } 
    ;


remote: Remote "{" "}"                      { $$ = new NodeRpc();$$.setType('remote') }
      |Remote "{" functions "}"             { $$ = $3; $$.setType('remote') }
      |Remote "{" functions "}" ";"         { $$ = $3; $$.setType('remote') }
      ;

handler: Handler "{"   "}"                  {$$ = new NodeRpc();$$.setType('handler') }
      |Handler"{" functions "}"             { $$ = $3; $$.setType("handler") }
      |Handler "{" functions "}" ";"        { $$ = $3; $$.setType("handler") }
      ;

typedefine:param ";"    {$$=$1} 
          ;

typedefines:typedefine                { $$=new NodeClass();$$.addNode($1)}
           |typedefines typedefine    { $$=$1;$$.addNode($2)} 
           ;


class:Class ID "{" typedefines "}"       { $$=$4;$$.id=$2;}
    | Class ID "{" typedefines "}" ";"   { $$=$4;$$.id=$2;}
    ;




service:Service ID "{" service_body "}" { $$=$4;$4.setId($2); }
        ;

namespace:Namespace ID ";"  {$$=$2};

service_body:class              {$$=new NodeService(); $$.addNode($1) }
        |handler                {$$=new NodeService(); $$.addNode($1) }
        |remote                 {$$=new NodeService(); $$.addNode($1) }
        |service_body class     {$$=$1; $$.addNode($2) }
        |service_body handler   {$$=$1; $$.addNode($2) }
        |service_body remote    {$$=$1; $$.addNode($2) }
        ;


expressions:
        namespace               {$$=new NodeRoot();$$.setId($1)}
        |service                {$$=new NodeRoot();$$.addNode($1)} 
        |EOF                    {$$=new NodeRoot()}
        |expressions namespace  {$$=$1;$$.setId($2)}
        |expressions service    {$$=$1;$$.addNode($2)}
        |expressions EOF        {console.log(" over....");parser.ast=$1;$1.genCode()}
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