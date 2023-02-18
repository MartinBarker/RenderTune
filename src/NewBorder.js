import React, { useState, useEffect } from 'react';
import "./Border/Border.js"

const { ipcRenderer } = window.require("electron");

//const { remote } = window.require("electron").remote;

function NewBorder({children}) {


  return (
    <>
        <div id='styledThis'>
       ZZZZZZZZZZZZZZZ
       ZZZZZZZZZZZZZZZ
       ZZZZZZZZZZZZZZZ
       ZZZZZZZZZZZZZZZ
        </div>
        {children}
        
    </>
  );
}

export default NewBorder;

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




