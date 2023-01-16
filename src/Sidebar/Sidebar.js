import React, { useState, useEffect } from 'react';
import './Sidebar.css'

function Sidebar() {
    const [showSideNav, setShowSideNav] = React.useState(true);
    const [toggleMenuItem, setToggleMenuItem] = React.useState(true);
    const [toggleSidebarIcon, setToggleSidebarIcon] = React.useState(false);



    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 767) {
                setShowSideNav(true)
                setToggleSidebarIcon(false)
            } else if (window.innerWidth < 767) {
                setShowSideNav(false)
                setToggleSidebarIcon(true)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => { window.removeEventListener('resize', handleResize) }
    }, [])

    //toggle open/close sidenav depending on current status
    function sideNavClicked() {
        console.log('sideNavClicked()')
        setShowSideNav(!showSideNav)
        setToggleSidebarIcon(!toggleSidebarIcon)
    }

    function menuItemClicked() {
        console.log('toggleMenuItem()')
        setToggleMenuItem(!toggleMenuItem)
    }

    return (
        <>
            <div className="main-content">

                {/* Always Visible Icons Sidebar */}
                <div id="sidebarIcons">
                    <div>
                        <a id="homeButton" className="" href="#">
                            <i className="fa fa-home" aria-hidden="true"></i>
                        </a>
                        <a data-toggle="modal" data-target="#new-upload-modal" id="newUploadButton" href="#" className="">
                            <i href="#" className="fa fa-plus-circle" aria-hidden="true"></i>
                        </a>
                        {/*
                        <a href="#menu-toggle" id="menu-toggle" className="svg-selected">
                            <svg className="custom-svg" xmlns="http://www.w3.org/2000/svg" version="1.0" width="168.000000pt" height="149.000000pt" viewBox="0 0 168.000000 149.000000" preserveAspectRatio="xMidYMid meet">
                                <g className="custom-svg" transform="translate(0.000000,149.000000) scale(0.100000,-0.100000)" fill="#818181" stroke="none">
                                    <path d="M1045 1433 c-88 -29 -168 -56 -177 -59 -16 -5 -18 2 -18 45 l0 51 -190 0 -190 0 0 -730 0 -730 190 0 190 0 0 677 c0 373 4 673 9 668 4 -6 42 -111 84 -235 91 -273 379 -1114 381 -1117 1 -1 81 23 178 54 l176 56 -135 396 c-74 218 -177 522 -230 676 -52 154 -98 285 -102 291 -4 8 -58 -6 -166 -43z"></path>
                                    <path d="M0 740 l0 -730 190 0 190 0 0 730 0 730 -190 0 -190 0 0 -730z"></path>
                                </g>
                            </svg>
                        </a>
                        <a data-toggle="modal" data-target="#render-jobs-modal" id="renderJobsButton" href="#" className="">
                            <i className="fa fa-tasks" aria-hidden="true"></i>
                            <div className="spinner-border renderJobsIconCircle" role="status" >
                                <span className="sr-only">Loading...</span>
                            </div>
                        </a>
                    */}
                    </div>
                </div>


                {/* Expand/Collapse Sidebar 
                <div id="sidebar" className={` super-animation sidebar ${showSideNav ? 'sidebar-show' : ' '} `} >
                    <a className='sidebar-header '>Martin Barker</a>
                    <a >About</a>
                    <a data-ulid="expand_this" onClick={menuItemClicked} >Projects <p id='projects-arrow'>▼</p></a>
                    <ul className={` ${toggleMenuItem ? 'ul-show' : ' '} `}>
                        <li><a >tagger.site</a></li>
                        <li><a >Vinyl2Digital</a></li>
                        <li><a >Popularify</a></li>
                    </ul>
                    <a >Blog</a>
                    <a >Contact</a>
                </div>
                */}

                {/* Page Contents
                <div id="main" className={` super-animation ${showSideNav ? 'show-sidebar' : ' '} `}>
                    <button className={`sidebarBtn ${toggleSidebarIcon ? 'collapsed-sidebarBtn' : ' '} `} onClick={sideNavClicked}>
                        <a className={`chevron-char ${toggleSidebarIcon ? 'sidebar-collapsed' : ' '} `} >&gt;</a>
                    </button>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                    PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT PAGE CONTENT <br></br>
                </div>
                 */}

            </div>
        </>
    )
}

export default Sidebar;




