const $ = require("jquery");
const path =require("path");
const fs = require("fs");
const pty = require('node-pty');
const os = require("os");
const Terminal = require('xterm').Terminal;
let { FitAddon } = require('xterm-addon-fit');


require("jstree");
let tabArr ={};
let myMonacco ,editor;
$(document).ready( async function(){
 editor = await createEditor();
let currDirPath = process.cwd();
console.log(currDirPath);
let name = path.basename(currDirPath);
console.log(name);
let data = [{
    id : currDirPath,
    parent : "#",
    text : name
}]
 let childArr = AddChild(currDirPath);
 data=[...data,...childArr];

 $("#tree").jstree({
     "core" : {
         "check_callback" :true,
         "data" : data
     },
 }).on("open_node.jstree",
      function(event,data){
            let children = data.node.children;
            for(let i=0;i<children.length;i++){
                //console.log(subChildArr[i]);
                let grandChild = AddChild(children[i]);
                for( let j=0;j<grandChild.length;j++){
                  let doesexist = $('#tree').jstree(true).get_node(grandChild[j].id);
                  if( doesexist){
                      return;
                  }
                  $('#tree').jstree().create_node(children[i] , grandChild[j], "last");
                }
            }
       })
.on("select_node.jstree",function( event ,dataObj){
    let filePath = dataObj.node.id;
    let isFile = fs.lstatSync(filePath).isFile();
    if( isFile){
        setData(filePath);
        createTab(filePath);
    }
})
const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
});

// Initialize xterm.js and attach it to the DOM
const xterm = new Terminal();
const fitAddon = new FitAddon;
xterm.loadAddon(fitAddon);
xterm.open(document.getElementById('terminal'));
// Setup communication between xterm.js and node-pty
    xterm.onData(function (data) {
    ptyProcess.write(data);
    }) 
    ptyProcess.on('data', function (data) {
    xterm.write(data);

   });
   fitAddon.fit();
   myMonacco.editor.setTheme("vs-dark");
})

function AddChild(parentPath){
    let isDir = fs.lstatSync(parentPath).isDirectory();
    if( isDir == false){
        return [];
    }
    let childrens = fs.readdirSync(parentPath);
    let childData = [];
    for(let i=0;i<childrens.length;i++){
        let cPath = path.join(parentPath,childrens[i]);
        let obj={
            id : cPath,
            parent : parentPath,
            text: childrens[i]
        };
        childData.push(obj);
    }
    return childData;
}
    function createEditor(){
        const amdLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
        const amdRequire = amdLoader.require;
        const amdDefine = amdLoader.require.define;
        amdRequire.config({
            baseUrl: './node_modules/monaco-editor/min'
        });
        self.module = undefined;
         return new Promise(function (resolve ,reject){
           amdRequire(['vs/editor/editor.main'], function () {
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript'
            });
            myMonacco = monaco;
            resolve(editor);
        });
      })
     // myMonacco.editor.setTheme("vs-dark");
}
function setData(filePath){
    let content = fs.readFileSync(filePath,"utf-8");
        editor.getModel().setValue(content);
        var model = editor.getModel();
        let ext = filePath.split(".").pop();
        if( ext == "js"){
            ext = "javascript";
        }
        myMonacco.editor.setModelLanguage(model,ext);
}
function createTab(filePath){
    let fileName = path.basename(filePath);
    if (!tabArr[filePath]) {
        $("#tabs-row").append(`<div class="tab">
        <div class="tab-name" id=${filePath} onclick=handleTab(this)>${fileName}</div>
        <i class="fas fa-times" id=${filePath} onclick=handleClose(this)></i>
        </div>`);
        tabArr[filePath] = fileName;
    }

}
function handleTab(elem) {
    let filePath = $(elem).attr("id");
    setData(filePath);
}
function handleClose(elem) {
    let filePath = $(elem).attr("id");
    delete tabArr[filePath];
    $(elem).parent().remove();
 fPath =$(".tab .tab-name").eq(0).attr("id");
    if(filePath){
        setData(filePath);
    }
}

