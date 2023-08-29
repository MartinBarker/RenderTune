import React from 'react';
import Frame from './Frame'
import Project from './Project'
import YouTube2 from './YouTube2';

function App() {
  return (
    <>
      <Frame/>
      <div style={{"marginTop":"40px"}}>
        <YouTube2/>
        <Project/>
      </div>
    </>
  );
}
export default App;
