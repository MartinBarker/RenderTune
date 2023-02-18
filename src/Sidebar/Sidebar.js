import React, { useState, useEffect } from 'react';
import './Sidebar.css'

function Sidebar({ children }) {
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
            {/* Always Visible Icons Sidebar */}
            <div id="sidebar">
                <div>
                    {/* home */}
                    <a className="sidebarIcon noDrag" href="#">
                        <svg className="sidebarSvg" width="50px" height="50px" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1472 992v480q0 26-19 45t-45 19h-384v-384h-256v384h-384q-26 0-45-19t-19-45v-480q0-1 .5-3t.5-3l575-474 575 474q1 2 1 6zm223-69l-62 74q-8 9-21 11h-3q-13 0-21-7l-692-577-692 577q-12 8-24 7-13-2-21-11l-62-74q-8-10-7-23.5t11-21.5l719-599q32-26 76-26t76 26l244 204v-195q0-14 9-23t23-9h192q14 0 23 9t9 23v408l219 182q10 8 11 21.5t-7 23.5z" />
                        </svg>
                    </a>
                    {/* plus sign in circle (new project) */}
                    <a className="sidebarIcon noDrag" href="#" >
                        <svg className="sidebarSvg" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1344 960v-128q0-26-19-45t-45-19h-256v-256q0-26-19-45t-45-19h-128q-26 0-45 19t-19 45v256h-256q-26 0-45 19t-19 45v128q0 26 19 45t45 19h256v256q0 26 19 45t45 19h128q26 0 45-19t19-45v-256h256q26 0 45-19t19-45zm320-64q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z" />
                        </svg>
                    </a>
                    {/* toggle open projects tab */}
                    <a className="sidebarIcon noDrag" href="#">
                        <svg className="sidebarSvg" width="50px" height="50px" version="1.0" viewBox="0 0 168.000000 149.000000" >
                            <g transform="translate(0.000000,149.000000) scale(0.100000,-0.100000)" stroke="none">
                                <path d="M1045 1433 c-88 -29 -168 -56 -177 -59 -16 -5 -18 2 -18 45 l0 51 -190 0 -190 0 0 -730 0 -730 190 0 190 0 0 677 c0 373 4 673 9 668 4 -6 42 -111 84 -235 91 -273 379 -1114 381 -1117 1 -1 81 23 178 54 l176 56 -135 396 c-74 218 -177 522 -230 676 -52 154 -98 285 -102 291 -4 8 -58 -6 -166 -43z"></path>
                                <path d="M0 740 l0 -730 190 0 190 0 0 730 0 730 -190 0 -190 0 0 -730z"></path>
                            </g>
                        </svg>
                    </a>
                    <a href="#menu-toggle" className="sidebarIcon noDrag" id="menu-toggle" >
                        <svg className="sidebarSvg" width="50px" height="50px" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M256 1312v192q0 13-9.5 22.5t-22.5 9.5h-192q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h192q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-192q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h192q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-192q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h192q13 0 22.5 9.5t9.5 22.5zm1536 768v192q0 13-9.5 22.5t-22.5 9.5h-1344q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1344q13 0 22.5 9.5t9.5 22.5zm-1536-1152v192q0 13-9.5 22.5t-22.5 9.5h-192q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h192q13 0 22.5 9.5t9.5 22.5zm1536 768v192q0 13-9.5 22.5t-22.5 9.5h-1344q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1344q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1344q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1344q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1344q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1344q13 0 22.5 9.5t9.5 22.5z" /></svg>
                    </a>
                </div>
            </div>
        </>
    )
}

export default Sidebar;




