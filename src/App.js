import React from 'react';
import Frame from './Frame'
import Project from './Project'

function App() {
  return (
    <>
      <Frame/>
      <div style={{"marginTop":"40px"}}>
        <Project/>
      </div>
    </>
  );
}
export default App;
