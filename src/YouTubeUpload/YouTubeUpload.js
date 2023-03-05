import React, { useState, useEffect } from 'react';
import "./YouTubeUpload.css"

function YouTubeUpload() {

    //run each function once at start
    useEffect(() => {
        createOauth2Client()
    }, [])

    function createOauth2Client(){
        console.log('create oauth2 client')
        
    }

    return (
        <>
            <div className='windowContentPadding'>
                <h1>YouTube API</h1>
            </div>

        </>
    );
}

export default YouTubeUpload;



