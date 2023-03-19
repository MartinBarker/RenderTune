import React, { useState, useEffect } from 'react';
import "./YouTubeUpload.css"

function YouTubeUpload() {

    //run each function once at start
    useEffect(() => {
        getYtUrl()
    }, [])

    function getYtUrl(){
        console.log('get youtube url')
        //make request to https://martinbarker.me/getYtUrl?port=8000
        
    }

    return (
        <>
          

        </>
    );
}

export default YouTubeUpload;



