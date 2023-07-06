import React, { useState, useEffect } from 'react';
const execa = window.require('execa');

function ExecaTest() {

    async function beginExecaTest(){
        console.log('beginExecaTest()')
        const {stdout} = await execa('echo', ['unicorns']);
        console.log(stdout);
    }

  return (<>
    Begin.
    <br /><hr />
    <button onClick={beginExecaTest}>EXECA</button>
    <br /><hr />
  </>);
}

export default ExecaTest;