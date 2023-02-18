import React, { useState, useEffect } from 'react';
import "./BlankTxtElem.css" 
const { ipcRenderer } = window.require("electron");

//const { remote } = window.require("electron").remote;


function BlankTxtElem({children}) {


  return (
    <>
        <div id='styledThis'>
            .


            div with style with style with style 
            div with style with style with style 
            div with style with style with style 
            div with style with style with style 
            div with style with style with style 
            div with style with style with style 

            .
        </div>
        {children}
        
    </>
  );
}

export default BlankTxtElem;

/*

module.exports = {
 getCurrentWindow,
  openMenu,
  minimizeWindow,
  maximizeWindow,
  unmaximizeWindow,
  maxUnmaxWindow,
  isWindowMaximized,
  closeWindow
  closeWindow,
}
*/




