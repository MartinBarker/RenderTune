const { Console } = require('console');
const { resolve } = require('path');
const { ipcRenderer } = window.require('electron');
const { join } = window.require('path');
var path = require('path');
const execa = window.require('execa');

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Auto-Update Event Handlers:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const notification = document.getElementById('notification');
const message = document.getElementById('message');
//if restart button is clicked:
const restartButton = document.getElementById('restart-button');ipcRenderer.on('update_available', () => {
  ipcRenderer.removeAllListeners('update_available');
  message.innerText = 'A new update is available. Downloading now...';
  notification.classList.remove('hidden');
});
//if update has been downloaded:
ipcRenderer.on('update_downloaded', () => {
  ipcRenderer.removeAllListeners('update_downloaded');
  message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
  restartButton.classList.remove('hidden');
  notification.classList.remove('hidden');
});
function closeNotification() {
  notification.classList.add('hidden');
}function restartApp() {
  ipcRenderer.send('restart_app');
}

//require datatables
require('datatables.net-dt')();
require('datatables.net-rowreorder-dt')();

//global var for renderList
var renderList = [];

// recieve app version and send it to html 
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
  ipcRenderer.removeAllListeners('app_version');
  const version = document.getElementById('version');
  version.innerText = 'v' + arg.version;
});

//when you click the home button
$("#homeButton").click(function (e) {
  //unselect all uploads
  unselectAllUploads()

  if ($("#homeButton").hasClass("page-selected")) {

  } else {
    console.log('toggle home button on')
    $("#homeButton").toggleClass("page-selected");
    //we are toggling the button on 
    $("#new-upload-html").hide();
    $("#upload-pages-container").hide();
    $("#default-home-html").show();
    //untoggle newUploadButton button if needed 
    if ($("#newUploadButton").hasClass('page-selected')) {
      $("#newUploadButton").toggleClass("page-selected");
    }
    //untoggle UploadsList button if needed 
    /*
    if ($("#menu-toggle").hasClass('svg-selected')) {
      $("#menu-toggle").toggleClass("svg-selected");
      $("#wrapper").toggleClass("toggled");
    }
    */
  }
});

//when you click the NewUpload button
$("#newUploadButton").click(function (e) {
  //hide render-jobs modal
  $('#render-jobs-modal').modal('hide');

  if (!$("#newUploadButton").hasClass("page-selected")) {
    $("#newUploadButton").toggleClass("page-selected");
  }
});

//when you click renderJobsButton
$("#renderJobsButton").click(function (e) {
  //hide new-upload modal
  $('#new-upload-modal').modal('hide');

  if (!$("#renderJobsButton").hasClass("page-selected")) {
    $("#renderJobsButton").toggleClass("page-selected");
  }
});
//if renderJobs modal is closed:
$('#render-jobs-modal').on('hide.bs.modal', function () {
  if ($("#renderJobsButton").hasClass("page-selected")) {
    $("#renderJobsButton").toggleClass("page-selected");
  }
})

// ----------------------------------------------------------------------------------
// jQuery event handler for when the menu-toggle icon is clicked
// Either expand or collapse the sidebar menu based on its current state
// ----------------------------------------------------------------------------------
$("#menu-toggle").click(function (e) {
  e.preventDefault();
  //toggle sidebar wrapper
  $("#wrapper").toggleClass("toggled");
  //toggle icon selected 
  $("#menu-toggle").toggleClass("svg-selected");
});

//if newUpload modal is closed:
$('#new-upload-modal').on('hide.bs.modal', function () {
  if ($("#newUploadButton").hasClass("page-selected")) {
    console.log('toggle new upload button on')
    $("#newUploadButton").toggleClass("page-selected");
  }
})

//when document window is ready call init function
$(document).ready(async function () {
  $('[data-toggle="tooltip"]').tooltip({'delay': { show: 5000, hide: 3000 }});
  
  //if OS is mac, clear local storage uploadList
  const os = window.require('os');
  const platform = os.platform();
  if (platform === 'darwin') {
    await setLocalStorage('uploadList', {})
  }

  //inital uploads sidebar display setup
  initUploadsSetup();
  //initial renders table setup
  initRendersSetup();
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

//ensure uploadList exists
async function initUploadsSetup() {
  //ensure uploadList exists
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  if (!uploadList) {
    setLocalStorage('uploadList', {})
  }
  //display uploads
  updateUploadListDisplay();
}

//update localstorage
async function setLocalStorage(itemName, itemValue) {
  let result = await localStorage.setItem(itemName, JSON.stringify(itemValue))
}

async function deleteAllUploads() {
  document.getElementById("upload-pages-container").innerHTML = "";
  await localStorage.setItem('uploadList', JSON.stringify({}))
  updateUploadListDisplay();
  $("#default-home-html").show();
}

/*
    NEW UPLOAD EVENT HANDLING:
*/

//if new upload files selection button is clicked
$("#newUploadFileSelection").change(async function (e) {
  var files = e.currentTarget.files;
  console.log('newUploadFileSelection: ', files);

  let event = { "dataTransfer": { "files": files } }
  newUploadFileDropEvent(event, false)
});

//get new upload drag&drop box
var newUploadBox = document.getElementById('newUploadFilesInput')
//add event listener when files get dropped into it
newUploadBox.addEventListener('drop', () => newUploadFileDropEvent(event, true))
//drag&drop events
newUploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
newUploadBox.addEventListener('dragenter', (event) => {
  //console.log('NEWUPLOAD File is in the Drop Space');
});
newUploadBox.addEventListener('dragleave', (event) => {
  //console.log('NEWUPLOAD File has left the Drop Space');
});

//when new upload modal is hidden, clear input values
$('#new-upload-modal').on('hidden.bs.modal', function (e) {
  document.getElementById('newUploadAudioFilesDisplay2').innerHTML='';
  document.getElementById('newUploadImageFilesDisplay2').innerHTML='';
  haveNewFilesBeenAdded = false;
  newUploadFiles = {}
  NewUploadFiles = null;
  $(this)
    .find("input,textarea,select")
    .val('')
    .end()
    .find("input[type=checkbox], input[type=radio]")
    .prop("checked", "")
    .end();
})

//if enter key is pressed and newUpload modal is open; click 'create'
$(document).keypress(function (e) {
  if (e.which == 13) {
    var isModalShown = ($("#new-upload-modal").data('bs.modal') || {})._isShown;
    console.log('enter clicked, isModalShown = ', isModalShown)
    if (isModalShown) {
      //click 'create' button
      document.getElementById('createUploadButton').click()
    }
  }
})

//when new upload modal is shown:
$('#new-upload-modal').on('shown.bs.modal', function (e) {
  //make input field focused
  $('input:text:visible:first', this).focus();
})

//create NewUploadFiles object to store files that the user is selecting
let NewUploadFiles = null;
//Call this function when files are added to a new upload in the popup modal either by drag&drop or file selection
async function newUploadFileDropEvent(event, preventDefault) {
  let haveNewFilesBeenAdded = false;
  //reveal loading spinner
  document.getElementById('loadingFilesSpinner').style.display = "block";
  //begin processing files
  if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  }
  //create NewUploadFiles object to store the NewUploadFiles if it doesn't exist
  if (!NewUploadFiles) {
    NewUploadFiles = { 'images': [], 'audio': [] }
  }
  //console.log('event.dataTransfer.files = ', event.dataTransfer.files)

  //sort all files into either audio or images 
  for (const f of event.dataTransfer.files) {
    // Using the path attribute to get absolute file path 
    if ((f.type).includes('image')) {
      //if image filepath does not already exist in newUploadTempFiles:
      if (NewUploadFiles.images.filter(e => e.path === `${f.path}`).length == 0) {
        NewUploadFiles.images.push({ 'path': f.path, 'type': f.type, 'name': f.name })
        //console.log('pushing image')
        haveNewFilesBeenAdded = true;
      }

    } else if ((f.type).includes('audio')) {
      let audioFileInfo = {};
      //get audio file format
      var splitType = (f.type).split('/')
      var audioFormat = splitType[1]
      audioFileInfo.format = audioFormat;
      //get audio metadata
      const metadata = await getMetadata(f.path);
      audioFileInfo.album = metadata.common.album || "";
      audioFileInfo.year = metadata.common.year || "";
      audioFileInfo.artist = metadata.common.artist || "";
      audioFileInfo.trackNum = metadata.common.track.no || "";
      audioFileInfo.length = metadata.format.duration ? new Date(metadata.format.duration * 1000).toISOString().substr(11, 8) : 0;

      //push results if that file isn't already inside .audio
      if (NewUploadFiles.audio.filter(e => e.path === `${f.path}`).length == 0) {
        NewUploadFiles.audio.push({
          'path': f.path,
          'type': audioFormat,
          'name': f.name,
          'length': audioFileInfo.length,
          'trackNum': audioFileInfo.trackNum,
          "album": audioFileInfo.album,
          "year": audioFileInfo.year,
          "artist": audioFileInfo.artist,

        })
        //console.log('pushing audio')
        haveNewFilesBeenAdded = true;
      }
    }
  }

  //console.log('newUploadFileDropEvent() NewUploadFiles = ', NewUploadFiles, '. haveNewFilesBeenAdded = ', haveNewFilesBeenAdded)

  //if new files have been added, update UI to display contents of NewUploadFiles
  if (haveNewFilesBeenAdded) {
    var imageFilesHtml = '';
    var imageFilesElem = document.createElement('div');
    var audioFilesHtml = '';
    //get img display parent <ul> element from html
    //for each new file
    for (const [key, value] of Object.entries(NewUploadFiles)) {
      if (key == 'images') {
        //for each image file
        for (var i = 0; i < value.length; i++) {
            //create new ul element for image that we can display to the user (add attribute imgFilePath)
            var ul = document.createElement('ul');
            ul.setAttribute('imgFilePath',`${value[i]['path']}`);
            ul.innerHTML=`${value[i]['name']}<br>`
            //create new img element we can add to that ul
            var imgElem = document.createElement('img');
            imgElem.setAttribute('src',`${value[i]['path']}`);
            imgElem.style.width = "40%";
            ul.appendChild(imgElem);
            imageFilesElem.appendChild(ul);
        }

      } else if (key == 'audio') {
        //for each audio file
        for (var x = 0; x < value.length; x++) {
          //update text files display
          audioFilesHtml = audioFilesHtml + `${value[x]['name']} <br>`;
        }
      }
    }
    document.getElementById('newUploadAudioFilesDisplay2').innerHTML=audioFilesHtml;
    document.getElementById('newUploadImageFilesDisplay2').innerHTML='';
    document.getElementById('newUploadImageFilesDisplay2').appendChild(imageFilesElem);
  }
  //hide loading spinner
  document.getElementById('loadingFilesSpinner').style.display = "none";
}

//call electron main.js to get audio metadata 
async function getMetadata(filename) {
  const metadata = await ipcRenderer.invoke('get-audio-metadata', filename);
  return metadata;
}

//when you click 'create' in the new upload modal
async function addNewUpload(uploadTitle) {
  console.log('addNewUpload() uploadTitle=', uploadTitle, '. NewUploadFiles=', NewUploadFiles)
  //if NewUploadFiles exists:
  if (NewUploadFiles) {
    //if there are no images:
    if (NewUploadFiles.images.length == 0) {
      document.getElementById('newUploadAlert').style.display = "block";

      //else if there are images:
    } else {
      document.getElementById('newUploadAlert').style.display = "none";
      $('#uploadModal').modal('hide');
      //get unique uploadNumber
      let uploadList = await JSON.parse(localStorage.getItem('uploadList'))
      let uploadNumber = 1
      if (uploadList != null) {
        //while upload already exists with that key
        while (uploadList[`upload-${uploadNumber}`]) {
          uploadNumber++
        }
      }

      //if title is null, set to default
      if (uploadTitle.length < 1) {
        uploadTitle = `upload-${uploadNumber}`
      }

      //set outputDir and outputFolder
      let outputDir = null;
      let outputFolder = "unset";
      //get default output dir from first image filepath for non-mac OS
      let firstImgPath = NewUploadFiles.images[0].path;
      const os = window.require('os');
      const platform = os.platform();
      if (platform === 'darwin') {
        console.log("on mac, so have outputDir unset by default ")
      }else{
        outputDir = firstImgPath.substr(0, firstImgPath.lastIndexOf(`${path.sep}`));
        outputFolder = outputDir.substr(outputDir.lastIndexOf(`${path.sep}`) + 1);
      }

      let uploadKey = `upload-${uploadNumber}`
      let uploadObj = { 'title': uploadTitle, 'files': NewUploadFiles, 'outputDir': outputDir, 'outputFolder': outputFolder }
      NewUploadFiles = null;

      //add to uploadList obj
      await addToUploadList(uploadKey, uploadObj)

      //close modal
      $('#new-upload-modal').modal('toggle');

      //update uploadListDisplay
      await updateUploadListDisplay()

      //unselect all uploads
      unselectAllUploads()

      //open uploads list sidebar if not already open
      if (!$("#menu-toggle").hasClass("svg-selected")) {
        $("#menu-toggle").toggleClass("svg-selected");
        $("#wrapper").toggleClass("toggled");
      }

      //click new upload so it is displayed to the user
      document.getElementById(`${uploadKey}-sidebar`).click()
    }
  }

}

//add new upload to uploadList
async function addToUploadList(uploadKey, uploadValue) {
  return new Promise(async function (resolve, reject) {
    //get uploadList from localstorage
    var uploadList = await JSON.parse(localStorage.getItem('uploadList'))

    //if uploadList does not exists
    if (uploadList == null) {
      //create new uploadList object
      let newUploadListObj = {}
      //set uploadList in localstorage
      await localStorage.setItem('uploadList', JSON.stringify(newUploadListObj))
      uploadList = await JSON.parse(localStorage.getItem('uploadList'))
    }

    //if uploadKey does not exist
    if (uploadList[uploadKey] == null) {
      //console.log(`setting ${uploadKey} in uploadList to be = `, uploadValue)
      uploadList[uploadKey] = uploadValue
      uploadList[uploadKey]['audio'] = uploadValue['audio']
    } else {
      //console.log(`${uploadKey} does exist in uploadList, so update pre-existing obj`)
    }

    //console.log("++ addToUploadList() done uploadList = ", uploadList)
    let result = await localStorage.setItem('uploadList', JSON.stringify(uploadList))
    //console.log('result = ', result)

    var tempuploadList = await JSON.parse(localStorage.getItem('uploadList'))
    //console.log('tempuploadList = ', tempuploadList)
    resolve()
  })
}

// ----------------------------------------------------------------------------------
// Update the left-hand sidebar view UploadList to display a the user's uploads
// ----------------------------------------------------------------------------------
async function updateUploadListDisplay() {
  return new Promise(async function (resolve, reject) {
    //clear sidebar html
    document.getElementById('sidebar-uploads').innerHTML = "";
    //get uploadList from localstorage
    var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
    //if uploadList exists
    if (uploadList != null) {
      //update numberOfUploads display
      document.getElementById('numberOfUploads').innerText = Object.keys(uploadList).length;
      //for each item in uploadList
      for (const [key, value] of Object.entries(uploadList)) {
        //get vars from upload
        let uploadId = key
        let uploadTitle = value.title
        let uploadFiles = value.files
        //use first image for display
        let imgPath = uploadFiles.images[0].path;
        uploadNumber = key.split('-')[1];
        //prepend upload to sidebar display
        $("#sidebar-uploads").prepend(`
          <li>
            <a class='sidebarText' href="#" id='${uploadId}-sidebar' onClick='displayUpload("${uploadId}")'>
              <img src="${imgPath}" class='sidebarUploadImg'>
             ${uploadTitle}
            </a>
          </li>
        `);
      }
    }
    resolve()
  })
}

// ----------------------------------------------------------------------------------
// Call this function if the user clicks an upload in the sidebar UploadsList menu
// Retrieve info for the upload, create html element, and display it to the user
// ----------------------------------------------------------------------------------
async function displayUpload(uploadId) {
  //if home icon is selected, unselect it
  if ($("#homeButton").hasClass("page-selected")) {
    $("#homeButton").toggleClass("page-selected");
  }
  //unselect all uploads
  unselectAllUploads()
  //make sidebar upload look selected
  document.getElementById(`${uploadId}-sidebar`).classList.add("sidebar-selected");
  //get uploadList from localstorage
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  //get upload we want to display
  var upload = uploadList[uploadId]
  //clear upload display
  document.getElementById("upload-pages-container").innerHTML = "";
  //create upload page
  createUploadPage(upload, uploadId);
  //make uploads visible
  $('#upload-pages-container').show()
  //hide default page
  $("#default-home-html").hide();
}

//unselect all uploads in sidebar
async function unselectAllUploads() {
  //get any elements currently selected and unselect them
  var selectedSidebarElems = document.getElementsByClassName('sidebar-selected')
  for (var q = 0; q < selectedSidebarElems.length; q++) {
    selectedSidebarElems[q].classList.remove("sidebar-selected");
  }
}

//create html for Upload view
async function createUploadPage(upload, uploadId) {
  //create image gallery container
  let images = [];
  for (var z = 0; z < upload.files.images.length; z++) {
    let img = upload.files.images[z]
    images.push(`<img src="${img.path}" data-caption="${img.name}">`)
  }

  //create <select> element for images
  let imageSelectionHTML = await createImgSelect(upload.files.images, `${uploadId}-imgSelect`, false)

  //add html to page
  let audioFilesCount = upload.files.audio.length;
  let imageFilesCount = upload.files.images.length;
  $("#upload-pages-container").append(`
    <div class="col-lg-12 upload">
      <!-- Upload Header Details -->
      <div>
        <!-- Upload Title -->
        <a id='uploadTitle'><strong>${upload.title}</strong></a> 
        <!-- Image FIles -->
        <a>(${audioFilesCount} audio files | ${imageFilesCount} image files)</a>
      </div>
      <!-- Upload Header Images -->
      <div id="visibleUploadImagesDisplay" style="height: 200px;overflow-x: scroll;margin-right: 16px;">
      </div>
      <h4>Tracklist:</h4>
      <!-- Tracklist table -->
      <div class='scroll'>
        <table id="${uploadId}_table" class="table table-sm table-bordered scroll display filesTable" cellspacing="2" width="100%">
            <thead> 
                <tr>
                  <!-- invisible number col -->
                  <th>sequence</th>

                  <!-- draggable number display col -->
                  <th style='min-width: 25px;'>#</th>
                  
                  <!-- select box -->
                  <th style="min-width: 20px;">
                    <input id='${uploadId}-tableSelectAll' type="checkbox">
                  </th>

                  <!-- Audio Filename -->
                  <th class='left-align-col' style="width:40%">Audio</th>
                  
                  <!-- Audio Length -->
                  <th class='left-align-col' style='max-width:58px'>Length</th>
                  
                  <!-- invisible audio filepath -->
                  <th>audioFilepath</th>
                  
                  <!-- audio track number -->
                  <th class='left-align-col' style='width:83px'>Track Num</th>

                  <!-- audio album -->
                  <th class='left-align-col'>Album</th>

                  <!-- audio year  -->
                  <th class='left-align-col' style='width:83px'>Year</th>

                  <!-- audio artist  -->
                  <th class='left-align-col' >Artist</th>
                  
                  <!-- image selection -->
                  <!-- <th class='left-align-col' style='width:300px'>
                      <div id='${uploadId}_table-image-col'>
                          <label>Img:</label>
                      </div>
                  </th> -->
                </tr>
            </thead>
        </table>
      </div>

      <!-- settings -->
      <h4 style='padding-top:10px'>Options:</h4>
      <div style='margin-right: 20px;'>
      <div class="row">
        
        <div class="col settingsCol">
          <!-- Image Selection -->
          <div class="form-group">
            <span>
              <label for="size">Image:
                <i class="fa fa-question-circle" data-delay='{"show":"5000", "hide":"3000"}' aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Chosen image that will be combined with audio to render a video."></i>
              </label>
              ${imageSelectionHTML}
            </span>
          </div>
        </div>

          <div class="col settingsCol" >
            <!-- Padding -->
            <div class="form-group">
              <span>
                <label for="size">Padding:
                  <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="If a padding option is selected, than the image will be padded to reach its resolution."></i>
                </label>
                <select id='${uploadId}-paddingSelect' class="form-control">
                  <option value="none">None</option>
                  <option value="white">White</option>
                  <option value="black">Black</option>
                </select>
              </span>
            </div>
          </div>

          <div class="col settingsCol" >
            <!-- Resolution -->
            <div class="form-group">
              <span>
                <label for="size">Resolution:
                  <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Output resolution for the rendered video."></i>
                </label>
                <select id='${uploadId}-resolutionSelect' class="form-control">
                </select>
              </span>
            </div>
          </div>

          <div class="col settingsCol changeDirButton" id='${uploadId}-changeDirDiv' onClick='changeDir("${uploadId}-dirText", "${uploadId}")'>
            <!-- Output Folder -->
            <div class="form-group">
              <span>
                <label for="size">Output Dir: 
                  <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Output folder where we will render the video."></i>
                </label>
                <div id='${uploadId}-dirText' class="changeDir">
                  <i class="fa fa-folder" aria-hidden="true"></i>  ${upload.outputFolder}
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>


    <h4>Renders:</h4>

    </div> 
    
    
    <!-- Full Album Upload -->
    <div class="card" style="left: 15px;
    width: 100%;
    margin-right: 50px;">
      <div class="card-header">
        Combine <a class='${uploadId}-numSelected'>0</a> songs into 1 video <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="This will combine however many audio files you have selected in the Tracklist Table into a single video file."></i>
      </div>
      <div class="card-body">
        <p class="card-text">
          Length:  <a id='${uploadId}-lengthText'></a>
          <br>
          Tracklist:  <br> 
          <code>
            <a id='${uploadId}-tracklistText'></a>
          </code>
        </p>

        <div>
          <!-- render button -->
          <a href="#" class="btn btn-primary" id='${uploadId}-concatRenderButton' onClick='concatRenderPrep("${uploadId}", "${uploadNumber}")' >Render</a>
          <a id='${uploadId}-concatRenderMsg' style='color:#fc3535; visibility:hidden;'>Please set your output folder</a>
        </div>

      </div>
    </div>
    <br>

    <!-- Individual Upload(s) -->
    <div class="card" style="left: 15px;
    width: 100%;
    margin-right: 50px;">
      <div class="card-header">
        Render <a class='${uploadId}-numSelected'>0</a> individual videos <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Keep everything as default or use the Batch Render Options to change any settings before clicking the 'Render' button to batch render multiple videos"></i>
      </div>
      <div class="card-body">
      
      <p class="card-text">
      Batch Render Options:
      </p>

      <!-- individual renders table -->
      <div class='scroll'>
        <table id="${uploadId}-individual-table" class="table table-sm table-bordered scroll display filesTable" cellspacing="2" width="100%">
            <thead> 
                <tr>

                  <!-- Audio Filename -->
                  <th class='left-align-col' >Audio</th>
                  
                  <!-- invisible audio filepath -->
                  <th>audioFilepath</th>

                  <!-- Audio Length -->
                  <th class='left-align-col' style='max-width:58px'>Length</th>
                  
                  <!-- Image Selection -->
                  <th class='left-align-col' style="min-width:200px !important" >
                    <div id='${uploadId}-individual-table-image-col'>
                        <label>Img:</label>
                    </div>
                  </th>

                  <!-- Padding Selection -->
                  <th class='left-align-col' style="width:200px" >
                    <div id='${uploadId}-individual-table-padding-col' >
                      <label>Padding:</label>
                    </div>
                  </th>

                  <!-- Resolution Selection -->
                  <th class='left-align-col' >
                    <div id='${uploadId}-individual-table-resolution-col' >
                      <label>Resolution:</label>
                    </div>
                  </th>

                </tr>
            </thead>
        </table>
      </div>
        <a onClick='individRenderPrep("${uploadId}", "${uploadNumber}")' href="#" class="btn btn-primary"><div>Render <new class='${uploadId}-numSelected'>0</new> videos</div></a>
        

        <a id='${uploadId}-individRenderMsg' style='color:#fc3535; visibility:hidden;'>Please set your output folder</a>
        

      </div>
    </div>

    </div>
    `);

  //if output folder == null, set color of changeDir button to red
  let uploads = await JSON.parse(localStorage.getItem('uploadList'))
  if(!(uploads[uploadId].outputDir)){
    document.querySelector(`#${uploadId}-dirText`).style.backgroundColor = "#fc3535";
  }

  //create Images Display elem
  let imgDisplayElemContainer = document.createElement('div');
  imgDisplayElemContainer.setAttribute("class","container");
  let imgDisplayElemRow = document.createElement('div');
  imgDisplayElemRow.setAttribute("class","row");
  //imgDisplayElemRow.setAttribute("style","overflow: scroll;");
  //for each image
  for(let i = 0; i < uploads[uploadId].files.images.length; i++){
    let imgDisplayElemDiv=document.createElement('div');
    imgDisplayElemDiv.setAttribute("class","col-sm");
    imgDisplayElemDiv.setAttribute("style","position: relative;min-width: 200px;min-height: 200px;"); 

  
    let imgPath = uploads[uploadId].files.images[i].path;
    let filename =  uploads[uploadId].files.images[i].name;
    let imgElement = document.createElement('img');
    imgElement.setAttribute("src",imgPath);
    imgElement.setAttribute("style","max-width: 150px;min-width: 150px;");

    let imgElementFilename = document.createElement('p');
    imgElementFilename.innerText=filename;

    imgDisplayElemDiv.appendChild(imgElement);
    imgDisplayElemDiv.appendChild(imgElementFilename);
    imgDisplayElemRow.appendChild(imgDisplayElemDiv)
    imgDisplayElemContainer.appendChild(imgDisplayElemRow)
  }

  //add images display elem to upload 
  document.getElementById('visibleUploadImagesDisplay').appendChild(imgDisplayElemContainer);

  //create Tracklist table
  createFilesTable(upload, uploadId);

  //create individual renders table
  createIndividualRendersTable(upload, uploadId);

  //generate resolutions for each image
  let uploadImageResolutions = await getResolutionOptions(upload.files.images);
  //create html options of resolutions based off the default selected image name, and add to ${uploadId}-resolutionSelect
  createResolutionSelect(uploadImageResolutions, upload.files.images[0].name, `${uploadId}-resolutionSelect`);

  //if padding option changes, update resolution options
  $(`#${uploadId}-paddingSelect`).on('change', async function () {

    //get padding choice
    let paddingChoice = $(this).val();

    //get image choice
    let newImageNum = $(`#${uploadId}-imgSelect`).val();
    let newImageName = upload.files.images[newImageNum].name;

    //generate new resolution options
    let uploadImageResolutions = await getResolutionOptions(upload.files.images);

    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-resolutionSelect`);
    } else {
      //newResOptions = generateResolutionOptions(uploadImageResolutions, newImageName);
      createResolutionSelect(uploadImageResolutions, newImageName, `${uploadId}-resolutionSelect`);
    }

  });

  //if image selection changes, update resolution options
  $(`#${uploadId}-imgSelect`).on('change', async function () {
    //get image info
    let newImageNum = $(this).val();
    let newImageName = upload.files.images[newImageNum].name;

    //get padding info
    let paddingChoice = $(`#${uploadId}-paddingSelect`).val();

    //generate new resolution options
    let uploadImageResolutions = await getResolutionOptions(upload.files.images);

    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-resolutionSelect`);
    } else {
      //newResOptions = generateResolutionOptions(uploadImageResolutions, newImageName);
      createResolutionSelect(uploadImageResolutions, newImageName, `${uploadId}-resolutionSelect`);
    }

  });

  //if output dir changes
  $(`${uploadId}-outputSelect`).bind("change paste keyup", function () {
    
  });

}

async function changeDir(displayTextID, uploadId) {
  //get new dirFolder and dirPath from user
  const dirPath = await ipcRenderer.invoke('choose-dir');
  let dirFolder = dirPath.substr(dirPath.lastIndexOf(`${path.sep}`) + 1);
  document.getElementById(displayTextID).innerHTML = `<i class="fa fa-folder" aria-hidden="true"></i>  ${dirFolder}`;
  //update upload
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  uploadList[uploadId].outputDir = dirPath
  uploadList[uploadId].outputFolder = dirFolder
  let result = await localStorage.setItem('uploadList', JSON.stringify(uploadList))
  //set changeDir button color to white
  document.querySelector(`#${uploadId}-dirText`).style.backgroundColor = "white";
  //hide 'change dir' err messages
  document.querySelector(`#${uploadId}-concatRenderMsg`).style.visibility='hidden';
  document.querySelector(`#${uploadId}-individRenderMsg`).style.visibility='hidden';

}

//call when 'Render' button for individual render(s) is clicked
async function individRenderPrep(uploadId, uploadNumber) {
  //get uploads
  let uploads = await JSON.parse(localStorage.getItem('uploadList'))
  //get upload
  let upload = uploads[uploadId];

    //get outputDir
    let outputDir = uploads[uploadId].outputDir;
    //if outputDir == unset, turn button red and reveal err message to user
    if(!outputDir){
      //set color of changeDir button
      //document.querySelector(`#${uploadId}-dirText`).style.backgroundColor = "#fc3535";
      //reveal message
      document.querySelector(`#${uploadId}-individRenderMsg`).style.visibility='visible';
    }else{
      //get table
      var table = $(`#${uploadId}-individual-table`).DataTable()
      //get all rows
      var rows = table.rows().data()
      //for each row
      for (var x = 0; x < rows.length; x++) {
        var row = rows[x]
        console.log(`individPrep() rows[${x}] = `, row)
        //
        // get audio for that row
        //
        //get audio input filepath
        let audioInputPath = row.audioFilepath;
        console.log('audioInputPath=', audioInputPath)

        //
        // get image choice for that row
        //
        //GET ID WE WILL USE TO GET IMAGE SELECTON RESULT FOR THAT ROW
        let imageLocationId = row.imgSelection.split(`id=`)[1].substring(1)
        imageLocationId = imageLocationId.substring(0, imageLocationId.indexOf(`'`)).trim()

        //get image selection form:
        //console.log(` get row at index: ${x} imageSelection: `, document.querySelector(`#${uploadId}-individual-table-image-row-${x}`))

        //get image input filepath
        let indexValueImgChoice = document.querySelector(`#${imageLocationId}`).value;
        console.log('indexValueImgChoice=', indexValueImgChoice)

        console.log('upload.files.images=', upload.files.images)


        //get img name
        let imageFilepath = upload.files.images[indexValueImgChoice].path
        console.log('imageFilepath=', imageFilepath)

        //
        //get resolution choice for that row
        //
        let resolutionLocationId = row.resolution.split(`id=`)[1].substring(1)
        resolutionLocationId = resolutionLocationId.substring(0, resolutionLocationId.indexOf(`'`)).trim()
        console.log('resolutionLocationId=',resolutionLocationId)
        let resolution = ($(`#${resolutionLocationId} :selected`).text()).split(" ")[0];
        console.log('chosen resolution=', resolution)

        //
        //get padding choice
        //
        let paddingLocationId = row.padding.split(`id=`)[1].substring(1)
        paddingLocationId = paddingLocationId.substring(0, paddingLocationId.indexOf(`'`)).trim()
        console.log('paddingLocationId=',paddingLocationId)
        let padding = $(`#${paddingLocationId}`).val();
        console.log('padding=', padding)
        //get outputDir and uploadName
        let outputDir = uploads[uploadId].outputDir;
        let uploadName = uploads[uploadId].title;

        //if audio file is not of type mp3, then convert to mp3:
        let audioType = audioInputPath.substr(audioInputPath.lastIndexOf('.'))
        console.log('audioType=', audioType)
        let concatAudioChoice = false
        if(audioType!='mp3'){
          console.log('not mp3 so convert')
          concatAudioChoice = true
        }

        //create outputFilename from row audio
        let filename = row.audio
        //remove filename ending
        filename=filename.substr(0, filename.lastIndexOf("."))
        //clean audio filename to make sure there aren't any special chars
        filename.replace(/[/\\?%*:|"<>]/g, '-');
        console.log('filename=', filename)

        //create render options
        let renderOptions = {
          audioFilepath:audioInputPath,
          concatAudio: concatAudioChoice,
          outputDir: outputDir,
          resolution: resolution,
          padding: padding,
          selectedRows: [row],
          uploadNumber: uploadNumber,
          uploadId: uploadId,
          uploadName: uploadName,
          concatAudioFilepath: `${outputDir}${path.sep}output-${(Date.now().toString()).substring(7)}.mp3`,
          imageFilepath: imageFilepath,
          outputVideoFilepath: `${outputDir}${path.sep}${(Date.now().toString()).substring(7)}-${filename}.mp4`
        }
        
        await render(renderOptions)
        
      }
    }

}

//call when 'Render' button for concat full album is clicked
async function concatRenderPrep(uploadId, uploadNumber) {
  //get uploads
  let uploads = await JSON.parse(localStorage.getItem('uploadList'))
  //get upload
  let upload = uploads[uploadId];
  //get resolution
  let resolution = $(`#${uploadId}-resolutionSelect option:selected`).text();
  resolution = (resolution.split(" ")[0]).trim()
  //get padding
  let padding = $(`#${uploadId}-paddingSelect option:selected`).text();
  //get image
  let imgChoice = document.getElementById(`${uploadId}-imgSelect`).value
  let imageFilepath = upload.files.images[imgChoice].path
  //get table
  var table = $(`#${uploadId}_table`).DataTable()
  //get all selected rows
  var selectedRows = table.rows('.selected').data()
  //get outputDir
  let outputDir = uploads[uploadId].outputDir;
  //if outputDir == unset, turn button red and reveal err message to user
  if(!outputDir){
    //set color of changeDir button
    document.querySelector(`#${uploadId}-dirText`).style.backgroundColor = "#fc3535";
    //reveal message
    document.querySelector(`#${uploadId}-concatRenderMsg`).style.visibility='visible';
  }else{
    //get uploadName
    let uploadName = uploads[uploadId].title;
    let renderOptions = {
      concatAudio: true,
      outputDir: outputDir,
      resolution: resolution,
      padding: padding,
      selectedRows: selectedRows,
      uploadNumber: uploadNumber,
      uploadId: uploadId,
      uploadName: uploadName,
      concatAudioFilepath: `${outputDir}${path.sep}output-${(Date.now().toString()).substring(7)}.mp3`,
      imageFilepath: imageFilepath,
      outputVideoFilepath: `${outputDir}${path.sep}concatVideo-${(Date.now().toString()).substring(7)}.mp4`
    }
    await render(renderOptions)
  }
}

async function debugRender(ffmpegArgs){
  return new Promise(async function (resolve, reject) {
    const getFfmpegPath = () => getFfPath('ffmpeg');
    //const getFfprobePath = () => getFfPath('ffprobe');
    const ffmpegPath = getFfmpegPath();
    const process = execa(ffmpegPath, ffmpegArgs);
    //handleProgress(process, cutDuration, renderStatusId);
    const result = await process;
    console.log('finished, result=', result)
    resolve(result);
  })
}

async function debugDir(){
  console.log('debugDir()')
  const returnVar = await ipcRenderer.invoke('set-dir');
  console.log('debugDir() returnVar=', returnVar)
  //return metadata;
}

//render using ffmpeg
async function render(renderOptions, debugConcatAudioCmd=null) {
  return new Promise(async function (resolve, reject) {
    console.log('render() function called. options=', renderOptions)
    var selectedRows = renderOptions.selectedRows;
    var outputDir = renderOptions.outputDir;
    var uploadName = renderOptions.uploadName;
    var uploadId = renderOptions.uploadId;
    var padding = renderOptions.padding;
    var concatAudioOutput = '';
    let cmdArr = [];
    //calculate duration
    let outputDuration = 0;
    for (var i = 0; i < selectedRows.length; i++) {
      //calculate total time
      var lengthSplit = selectedRows[i].length.split(':'); // split length at the colons
      // minutes are worth 60 seconds. Hours are worth 60 minutes.
      var seconds = (+lengthSplit[0]) * 60 * 60 + (+lengthSplit[1]) * 60 + (+lengthSplit[2]);
      outputDuration = outputDuration + seconds;
    }

    //if we need to combine audio, do it first
    if (renderOptions.concatAudio) {
      let concatAudioFilepath = renderOptions.concatAudioFilepath;
      //add inputs
      cmdArr.push('-y')
      let filterMapStr='';
      for (var i = 0; i < selectedRows.length; i++) {
        cmdArr.push('-i')
        cmdArr.push(`${selectedRows[i].audioFilepath}`);
        filterMapStr=`${filterMapStr}[${i}:a]`;
      }

      //add concat options
      cmdArr.push("-filter_complex")
      cmdArr.push(`${filterMapStr}concat=n=${i}:v=0:a=1[a]`)
      cmdArr.push(`-map`)
      cmdArr.push(`[a]`)
      //add audio codec and quality 
      cmdArr.push("-c:a")
      cmdArr.push("libmp3lame")
      cmdArr.push("-b:a")
      cmdArr.push("320k")
      //set output 
      cmdArr.push(concatAudioFilepath);
      //add to renderList
      let renderStatusId = `${uploadId}-render-${(Date.now().toString()).substring(7)}`;
      addToRenderList('concatAudio', outputDuration, uploadName, outputDir, concatAudioFilepath, renderStatusId)
      //run ffmpeg command to concat audio
      if(debugConcatAudioCmd){
        console.log('setting debugConcatAudioCmd')
        cmdArr=debugConcatAudioCmd;
      }
      console.log('concatAudio: cmdArr=',cmdArr.join(" ") );

      let runFfmpegCommandResp = await runFfmpegCommand(cmdArr, outputDuration, renderStatusId);
      concatAudioOutput = concatAudioFilepath;
    }

    //render video
    cmdArr = [];
    let audioInput = concatAudioOutput || renderOptions.audioFilepath;
    let videoOutput = renderOptions.outputVideoFilepath;
    let imageFilepath = renderOptions.imageFilepath;
    cmdArr.push('-loop')
    cmdArr.push('1')
    cmdArr.push('-framerate')
    cmdArr.push('2')
    cmdArr.push('-i')
    cmdArr.push(`${imageFilepath}`)
    cmdArr.push('-i')
    cmdArr.push(`${audioInput}`)
    cmdArr.push('-y')
    cmdArr.push('-acodec')
    cmdArr.push('copy')
    cmdArr.push('-b:a')
    cmdArr.push('320k')
    cmdArr.push('-vcodec')
    cmdArr.push('libx264')
    cmdArr.push('-b:v')
    cmdArr.push('8000k')
    cmdArr.push('-maxrate')
    cmdArr.push('8000k')
    cmdArr.push('-minrate')
    cmdArr.push('8000k')
    cmdArr.push('-bufsize')
    cmdArr.push('3M')
    cmdArr.push('-filter:v')
    if (padding.toLowerCase() == 'none') {
      //console.log('NO PADDING')
      let width=parseInt(renderOptions.resolution.split('x')[0]);
      if(width % 2 !== 0){
        //width not divisible by two, add one extra pixel of padding
        width=width+1
      }

      let height=parseInt(renderOptions.resolution.split('x')[1]);
      if(height % 2 !== 0){
        //width not divisible by two, add one extra pixel of padding
        height=height+1
      }

      //console.log(`NO PADDING final: width=${width}, height=${height}`)
      cmdArr.push(`scale=w=${width}:h=${height}`)
    } else {
      //console.log('YES PADDING')
      cmdArr.push(`scale=w='if(gt(a,1.7777777777777777),${renderOptions.resolution.split('x')[0]},trunc(${renderOptions.resolution.split('x')[1]}*a/2)*2)':h='if(lt(a,1.7777777777777777),${renderOptions.resolution.split('x')[1]},trunc(${renderOptions.resolution.split('x')[0]}/a/2)*2)',pad=w=${renderOptions.resolution.split('x')[0]}:h=${renderOptions.resolution.split('x')[1]}:x='if(gt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[0]}-iw)/2)':y='if(lt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[1]}-ih)/2)':color=${padding.toLowerCase()}`)
    }
    cmdArr.push('-preset')
    cmdArr.push('medium')
    cmdArr.push('-tune')
    cmdArr.push('stillimage')
    cmdArr.push('-crf')
    cmdArr.push('18')
    cmdArr.push('-pix_fmt')
    cmdArr.push('yuv420p')
    cmdArr.push('-shortest')
    cmdArr.push(`${videoOutput}`)
    //add to renderList
    renderStatusId = `${uploadId}-render-${((Date.now().toString()).substring(7).toString()).substring(7)}`;
    addToRenderList('video', outputDuration, uploadName, outputDir, videoOutput, renderStatusId)
    //run ffmpeg command to render video

    console.log('renderVideo: cmdArr=',cmdArr.join(" ") );
    let runFfmpegCommandResp = await runFfmpegCommand(cmdArr, outputDuration, renderStatusId);

    //delete concatAudio filepath if needed
    if (renderOptions.concatAudio) {
      deleteFile(concatAudioOutput)
    }

    resolve(runFfmpegCommandResp)
  })

}

//add new render to renders list
async function addToRenderList(renderType, durationSeconds, uploadName, outputDir, outputFile, renderStatusId) {
  renderList.push({
    status: 'in-progress',
    type: renderType,
    durationSeconds: durationSeconds,
    uploadName: uploadName,
    outputDir: outputDir,
    outputFilename: (outputFile.substr(outputFile.lastIndexOf(`${path.sep}`) + 1)),
    renderStatusId: `${renderStatusId}`
  });
  updateRendersModal()
}

//delete file on the user's machine
function deleteFile(path) {
  const fs = require('fs')
  fs.unlink(path, (err) => {
    if (err) {
      console.error("err deleting file = ", err)
      return
    }
  })
}

//update renders modal that displays in progress/completed/failed renders
async function updateRendersModal() {
  let rendersInProgress = 0;
  //get renders table
  var table = $(`#renders-table`).DataTable();
  //clear table data
  table.clear()
  //add data to table
  for (var i = 0; i < renderList.length; i++) {
    let data = renderList[i];
    let renderStatus = `<a id="${data.renderStatusId}"></a>`;
    if (data.status != 'done') {
      rendersInProgress++
    } else {
      renderStatus = 'Done'
    }
    table.row.add({
      "selectAll": '<input type="checkbox">',
      "filename": data.outputFilename,
      "status": renderStatus,
      "length": (new Date(data.durationSeconds * 1000).toISOString().substr(11, 8)),
      "uploadName": data.uploadName,
    })
  }


  //if select all checkbox clicked
  $(`#renders-tableSelectAll`).on('click', function (event) {
    let checkedStatus = document.getElementById(`renders-tableSelectAll`).checked
    if (checkedStatus == true) {
      //select all
      var rows = table.rows().nodes();
      $('input[type="checkbox"]', rows).prop('checked', true);
      table.$("tr").addClass('selected')
    } else {
      //unselect all
      var rows = table.rows().nodes();
      $('input[type="checkbox"]', rows).prop('checked', false);
      table.$("tr").removeClass('selected')
    }
    //updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);
  });

  //if a row is clicked
  $(`#renders-table tbody`).on('click', 'tr', function () {
    //determine whether or not to select/deselect & check/uncheck row
    var isSelected = $(this).hasClass('selected')
    $(this).toggleClass('selected').find(':checkbox').prop('checked', !isSelected);
    //updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);

  });

  //if table order changes
  //table.on('order.dt', function (e, diff, edit) {
  //  resetTableSelections(`${uploadId}_table`, uploadId);


  //if there are renders in progress, make sidebar spinner visible, else make invisible
  if (rendersInProgress > 0) {
    document.querySelector(`.renderJobsIconCircle`).style.setProperty("display", "inline", "important");
    document.getElementById('renderJobsCount').innerText = `${rendersInProgress}`
  } else {
    document.querySelector(`.renderJobsIconCircle`).style.setProperty("display", "none", "important");
    document.getElementById('renderJobsCount').innerText = `0`
  }

  //draw table
  table.draw();
}

async function initRendersSetup() {
  //create renders table
  var table = $(`#renders-table`).DataTable({
    "autoWidth": true,
    "pageLength": 5000,
    select: {
      style: 'multi',
      selector: 'td:nth-child(0)'
    },
    columns: [
      { "data": "selectAll" },
      { "data": "filename" },
      { "data": "status" },
      { "data": "length" },
      { "data": "uploadName" }
    ],
    columnDefs: [
      {//select all checkbox
        "className": 'selectall-checkbox',
        "className": "text-center",
        searchable: false,
        orderable: false,
        targets: 0,
      },
    ],
    "language": {
      "emptyTable": "No current renders"
    },
    dom: 'rt',

  });
}

//run ffmpeg command 
async function runFfmpegCommand(ffmpegArgs, cutDuration, renderStatusId) {
  return new Promise(async function (resolve, reject) {
    const getFfmpegPath = () => getFfPath('ffmpeg');
    //const getFfprobePath = () => getFfPath('ffprobe');
    const ffmpegPath = getFfmpegPath();
    const process = execa(ffmpegPath, ffmpegArgs);
    handleProgress(process, cutDuration, renderStatusId);
    const result = await process;
    resolve(result);
  })
}

const moment = window.require("moment");
const readline = window.require('readline');
function handleProgress(process, cutDuration, renderStatusId) {
  //set to zero % compelted as initial default
  document.getElementById(renderStatusId).innerText = '0%';
  //read progress from process
  const rl = readline.createInterface({ input: process.stderr });
  rl.on('line', (line) => {

    try {
      let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
      if (!match) match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      if (!match) return;

      const str = match[1];
      const progressTime = Math.max(0, moment.duration(str).asSeconds());
      const progress = cutDuration ? progressTime / cutDuration : 0;
      var displayProgress = parseInt(progress * 100)
      //update table display
      document.getElementById(renderStatusId).innerText = `${displayProgress}%`;
      //if render has completed
      if (displayProgress >= 100) {
        //get render from renderList
        for (var z = 0; z < renderList.length; z++) {
          //update render status to be 'done'
          if (renderList[z].renderStatusId == renderStatusId) {
            renderList[z].status = 'done'
          }
          //update render modal display
          updateRendersModal()
        }
      }

      //onProgress(progress);
    } catch (err) {
      console.log('Failed to parse ffmpeg progress line', err);
    }
  });
}

//new ffmpeg functions:
function getFfCommandLine(cmd, args) {
  const mapArg = arg => (/[^0-9a-zA-Z-_]/.test(arg) ? `'${arg}'` : arg);
  return `${cmd} ${args.map(mapArg).join(' ')}`;
}

function getFfPath(cmd) {
  try {
    const isDev = window.require('electron-is-dev');
    const os = window.require('os');
    const platform = os.platform();
    console.log("getFfPath() platform = ", platform, ", isDev=", isDev);
    let winInstallerBuild="";
    let exeName = "";
    if (platform === 'darwin') {
      return isDev ? `ffmpeg-mac/${cmd}` : join(window.process.resourcesPath, cmd);
    }else if(platform === 'win32'){
      //for win installer build with auto-updating, it installs with 'app.asar.unpacked' filepath before node_modules
      winInstallerBuild="app.asar.unpacked/"
      exeName = `${cmd}.exe`;
    }else{
      exeName = cmd;
    }
    
    if(isDev){
      exeName=`node_modules/ffmpeg-ffprobe-static/${exeName}`;
    }else{
      exeName=join(window.process.resourcesPath, `${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName}`);
    }

    //if snap build downloaded from store has wrong ffmpeg filepath:
    if(!isDev && platform==="linux" && exeName.match(/snap\/rendertune\/\d+(?=\/)\/resources/)){
      console.log("getFfPath() snap linux path before: ", exeName)
      exeName=exeName.replace(/snap\/rendertune\/\d+(?=\/)\/resources/, "/snap/rendertune/current/resources/app.asar.unpacked/")
    }

    console.log("getFfPath() returning exeName=", exeName);
    return(exeName);

  } catch (err) {
    console.log('getFfPath cmd=', cmd, '. err = ', err)
    return ("")
  }

}

async function runFfprobe(args) {
  const ffprobePath = getFfprobePath();
  console.log(getFfCommandLine('ffprobe', args));
  return execa(ffprobePath, args);
}

function runFfmpeg(args) {
  console.log('runFfmpeg() args = ', args)
  const ffmpegPath = getFfmpegPath();
  console.log(getFfCommandLine('ffmpeg', args));
  return execa(ffmpegPath, args);
}

async function createIndividualRendersTable(upload, uploadId) {

  //setup table
  var table = $(`#${uploadId}-individual-table`).DataTable({
    "autoWidth": true,
    "pageLength": 5000,

    columns: [
      { "data": "audio" },
      { "data": "audioFilepath" }, //invisible
      { "data": "length" },
      { "data": "imgSelection" },
      { "data": "padding" },
      { "data": "resolution" },
    ],
    columnDefs: [
      //audio filename
      {
        targets: 0,
        type: "natural",
        className: 'track-name',
        sortable: false,
      },
      //invisible audioFilepath
      {
        targets: 1,
        visible: false,
        sortable: false,
      },
      { targets: 2, sortable: false },
      { targets: 3, sortable: false },
      { targets: 4, sortable: false },
      { targets: 5, sortable: false },

    ],
    "language": {
      "emptyTable": "No files selected"
    },
    dom: 'rt',

  });

  //create img selection col header and add it to table
  let imgSelect = await createImgSelect(upload.files.images, `${uploadId}-individual-table-image-col`, true, 'max-width: 150px;')
  document.getElementById(`${uploadId}-individual-table-image-col`).innerHTML = imgSelect;
  //create padding selection col header and add it to table
  let paddingSelect = await createPaddingSelect(`${uploadId}-individual-table-padding-col`, true, 'max-width: 100px;')
  document.getElementById(`${uploadId}-individual-table-padding-col`).innerHTML = paddingSelect;
  //create resolution selection col header and add it to table
  let resolutionSelect = await createResolutionSelectIndividualCol(`${uploadId}-individual-table-padding-col`, true, 'max-width: 50px;', 4)
  document.getElementById(`${uploadId}-individual-table-resolution-col`).innerHTML = resolutionSelect;

  //draw table
  table.draw();

  //get img resolutions info
  let uploadImageResolutions = await getResolutionOptions(upload.files.images);

  //if image selection col header changes, update each row
  $(`#${uploadId}-individual-table-image-col`).on('change', async function () {
    //get new image choice
    let indexValueImgChoice = document.querySelector(`#${uploadId}-individual-table-image-col select`).value
    //get img name
    let imgInfo = upload.files.images[indexValueImgChoice]

    //set all rows in table to have new image value
    table.rows().eq(0).each(async function (index) {
      //get padding choice for this row
      let rowPaddingChoice = $(`#${uploadId}-individual-table-padding-row-${index}`).val()
      //update selected img value for row
      document.getElementById(`${uploadId}-individual-table-image-row-${index}`).selectedIndex = `${indexValueImgChoice}`;

      //if padding is not 'none', generate dropdown with static resolutions
      if (!rowPaddingChoice.includes('none')) {
        createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${index}`);
      } else {
        createResolutionSelect(uploadImageResolutions, imgInfo.name, `${uploadId}-individual-table-resolution-row-${index}`);
      }

    });
  });

  //if padding selection col header changes, update each row
  $(`#${uploadId}-individual-table-padding-col`).on('change', async function () {
    //get new padding choice
    let indexValuePaddingChoice = document.querySelector(`#${uploadId}-individual-table-padding-col select`).value
    //set all rows in table to have new padding value
    table.rows().eq(0).each(async function (index) {

      //get image choice for row
      let indexValueImgChoice = document.querySelector(`#${uploadId}-individual-table-image-row-${index}`).value
      //get img name
      let imgInfo = upload.files.images[indexValueImgChoice]
      console.log('img name for this row: ', imgInfo.name)

      //update selected padding choice for row
      document.getElementById(`${uploadId}-individual-table-padding-row-${index}`).value = `${indexValuePaddingChoice}`
      //get padding choice for this row
      let rowPaddingChoice = $(`#${uploadId}-individual-table-padding-row-${index}`).val()
      //if padding is not 'none', generate dropdown with static resolutions
      if (!rowPaddingChoice.includes('none')) {
        createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${index}`);
      } else {
        createResolutionSelect(uploadImageResolutions, imgInfo.name, `${uploadId}-individual-table-resolution-row-${index}`);
      }
    });
  });

  //if resolution selection col header changes, update each row
  $(`#${uploadId}-individual-table-resolution-col`).on('change', async function () {
    //get new resolution choice
    let indexValueResolutionChoice = document.querySelector(`#${uploadId}-individual-table-resolution-col select`).value - 1;
    console.log('indexValueResolutionChoice = ', indexValueResolutionChoice)
    //set all rows in table to have new resolution value
    table.rows().eq(0).each(function (index) {
      document.getElementById(`${uploadId}-individual-table-resolution-row-${index}`).selectedIndex = `${indexValueResolutionChoice}`
    });
  });

}

async function createFilesTable(upload, uploadId) {
  //create dataset
  let data = await createFilesTableDataset(upload.files, uploadId, upload)

  //setup table
  var reorder = false;
  var searched = false;
  var origIndexes = [];
  var origSeq = [];
  var origNim = [];

  let tableId = `#${uploadId}_table`;
  //create table
  var table = $(tableId).DataTable({
    "autoWidth": true,
    "pageLength": 5000,
    select: {
      style: 'multi',
      selector: 'td:nth-child(2)'
    },
    columns: [
      { "data": "sequence" },
      { "data": "#" },
      { "data": "selectAll" },
      { "data": "audio" },
      { "data": "length" },
      { "data": "audioFilepath" },
      { "data": "trackNum" },
      { "data": "album" },
      { "data": "year" },
      { "data": "artist" },
      //{ "data": "imgSelection" },
    ],
    columnDefs: [
      { //invisible sequence num
        searchable: false,
        orderable: false,
        visible: false,
        targets: 0,
      },
      { //visible sequence num
        searchable: false,
        orderable: false,
        targets: 1,

      },
      {//select all checkbox
        "className": 'selectall-checkbox',
        "className": "text-center",
        searchable: false,
        orderable: false,
        targets: 2,
      },
      {//audio filename 
        targets: 3,
        type: "natural",
        className: 'track-name'
      },
      /*
      {//audio format
          targets: 4,
          type: "string"
      },
      */
      { //audio file length
        targets: 4,
        type: "string"
      },
      /*
      
      { //video output format
          targets: 6,
          type: "string",
          orderable: false
      },
      */
      {//audioFilepath
        targets: 5,
        visible: false,
      },
      {//trackNum
        targets: 6,
        visible: true,
        orderable: true,
      },
      {//album
        "className": "album-col",
        targets: 7,
        visible: true,
        orderable: true,
      },
      {//year
        targets: 8,
        visible: true,
        orderable: true,
      },
      {//artist
        targets: 9,
        visible: true,
        orderable: true,
        type: "natural",
        className: 'track-name'

      },
      /*
      { //image selection
        targets: 7,
        type: "string",
        orderable: false,
        className: 'text-left'
      },
      */
    ],
    "language": {
      "emptyTable": "No files in this upload"
    },
    dom: 'rt',
    rowReorder: {
      dataSrc: 'sequence',
    },

  });

  //add dataset to table
  var count = 1;
  data.forEach(function (i) {
    table.row.add({
      "sequence": i.itemId,
      "#": `<div style='cursor: pointer;'><i class="fa fa-bars"></i> ${count}</div>`,
      "selectAll": '<input type="checkbox">',
      "audio": i.audio,
      "length": i.length,
      //"outputFormat": i.vidFormatSelection,
      //"outputLocation": "temp output location",
      "audioFilepath": i.audioFilepath,
      "trackNum": i.trackNum,
      "album": i.album,
      "year": i.year,
      "artist": i.artist,
      //"imgSelection": i.imgSelection,
    }).node().id = 'rowBrowseId' + i.sampleItemId;
    count++;
  });
  //draw table
  table.draw();

  //if select all checkbox clicked
  $(`#${uploadId}-tableSelectAll`).on('click', function (event) {
    let checkedStatus = document.getElementById(`${uploadId}-tableSelectAll`).checked
    if (checkedStatus == true) {
      //select all
      var rows = table.rows().nodes();
      $('input[type="checkbox"]', rows).prop('checked', true);
      table.$("tr").addClass('selected')
    } else {
      //unselect all
      var rows = table.rows().nodes();
      $('input[type="checkbox"]', rows).prop('checked', false);
      table.$("tr").removeClass('selected')
    }
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);
  });

  //if a row is clicked
  $(`#${uploadId}_table tbody`).on('click', 'tr', function () {
    //determine whether or not to select/deselect & check/uncheck row
    var isSelected = $(this).hasClass('selected')
    $(this).toggleClass('selected').find(':checkbox').prop('checked', !isSelected);
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);

  });

  //if table order changes
  table.on('order.dt', function (e, diff, edit) {
    resetTableSelections(`${uploadId}_table`, uploadId);
    //don't adjust "#" column if already changed by rowReorder or search events
    if (!reorder && !searched) {
      //console.log('order.dt - resetting order');
      i = 1;
      //assign "#" values in row order
      table.rows({ search: 'applied', order: 'applied' }).every(function (rowIdx, tableLoop, rowLoop) {
        var data = this.data();
        data['#'] = `<div style='cursor: pointer;'><i class="fa fa-bars"></i> ${i}</div>`//i;
        i++;
        this.data(data);
      });
    }
    //reset booleans
    reorder = false;
    searched = false;

    //update displays of full album tracklist and selectedCount
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);

  });

  table.on('row-reorder', function (e, details, edit) {
    //get original row indexes and original sequence (rowReorder indexes)
    origIndexes = table.rows().indexes().toArray();
    origSeq = table.rows().data().pluck('sequence').toArray();
    //update displays of full album tracklist and selectedCount
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);
  });

  table.on('search.dt', function () {
    //console.log('search', reorder);
    //skip if reorder changed the "#" column order
    if (!reorder) {
      //console.log('search.dt - resetting order');
      i = 1;
      //assign "#" values in row order
      table.rows({ search: 'applied', order: 'applied' }).every(function (rowIdx, tableLoop, rowLoop) {
        var data = this.data();
        data['#'] = `<div style='cursor: pointer;'><i class="fa fa-bars"></i> ${i}</div>`//i;
        i++;
        this.data(data);
      });
    }
    //don't change "#" order in the order event
    searched = true;
  });

  table.on('row-reordered', function (e, details, edit) {
    //console.log('row-reorderd');
    //get current row indexes and sequence (rowReorder indexes)
    var indexes = table.rows().indexes().toArray();
    //console.log('org indexes', origIndexes);
    //console.log('new indexes', indexes);
    var seq = table.rows().data().pluck('sequence').toArray();
    //console.log('org seq', origSeq);
    //console.log('new seq', seq);
    i = 1;

    for (var r = 0; r < indexes.length; r++) {
      //get row data
      var data = table.row(indexes[r]).data();
      //console.log('looking for',seq[r]);
      //get new sequence 
      //origSeq   [1, 3, 4, 2]
      //seq       [3, 4, 1, 2]
      //indexes   [0, 2, 3, 1]
      //use the new sequence number to find index in origSeq
      //the (index + 1) is the original row "#" to assign to the current row
      newSeq = origSeq.indexOf(seq[r]);
      //console.log('found new seq',newSeq);

      //assign the new "#" to the current row
      data['#'] = `<div style='cursor: pointer;'><i class="fa fa-bars"></i> ${newSeq + 1}</div>`//newSeq + 1;
      table.row(indexes[r]).data(data);

    }
    //re-sort the table by the "#" column
    table.order([1, 'asc']);

    //don't adjust the "#" column in the search and order events
    reorder = true;

    //update displays of full album tracklist and selectedCount
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);
  });

  //row-reorder
  table.on('row-reorder', function (e, diff, edit) {
    var result = 'Reorder started on row: ' + edit.triggerRow.data()[1] + '<br>';

    for (var i = 0, ien = diff.length; i < ien; i++) {
      var rowData = table.row(diff[i].node).data();

      result += rowData[1] + ' updated to be in position ' +
        diff[i].newData + ' (was ' + diff[i].oldData + ')<br>';
    }

    //update displays of full album tracklist and selectedCount
    updateSelectedDisplays(`${uploadId}_table`, `${uploadId}`);
  });
}

function resetTableSelections(uploadTableId, uploadId) {
  //get table
  var table = $(`#${uploadTableId}`).DataTable();
  //unselect all rows in table
  var rows = table.rows().nodes();
  $('input[type="checkbox"]', rows).prop('checked', false);
  table.$("tr").removeClass('selected')
  //if select all is clicked: unselect
  let checkedStatus = document.getElementById(`${uploadId}-tableSelectAll`).checked;
  if (checkedStatus) {
    document.getElementById(`${uploadId}-tableSelectAll`).checked = false
  }
}

//update displays of full album tracklist and selectedCount
async function updateSelectedDisplays(uploadTableId, uploadId) {
  let uploads = await JSON.parse(localStorage.getItem('uploadList'))
  //get upload
  let upload = uploads[uploadId];
  //get and clear individual renders table
  var individualRendersTable = $(`#${uploadId}-individual-table`).DataTable();
  individualRendersTable.clear();
  //get Tracklist table
  var table = $(`#${uploadTableId}`).DataTable()
  //get number of selected rows
  var selectedRows = table.rows('.selected').data()
  //get number of selected rows
  var selectedRowsCount = selectedRows.length;
  //update every numSelected class to include the number of row selected as innerText
  let updateThese = document.querySelectorAll(`.${uploadId}-numSelected`);
  for (var x = 0; x < updateThese.length; x++) {
    updateThese[x].innerText = selectedRowsCount
  }

  let uploadImageResolutions = await getResolutionOptions(upload.files.images);
  var fullAlbumLength = ''
  var fullAlbumTracklist = ''
  let startTime, endTime = '0:00:00';
  //for each selected row
  for (var i = 0; i < selectedRowsCount; i++) {
    //get data for individualRenderTable
    var row = selectedRows[i];
    //create imgSelect
    let rowImgSelect = await createImgSelect(upload.files.images, `${uploadId}-individual-table-image-row-${i}`, false, 'max-width:150px', 'rowImg')
    //create paddingSelect
    let rowPaddingSelect = await createPaddingSelect(`${uploadId}-individual-table-padding-row-${i}`, false, 'max-width:100px', 'rowPadding')

    //add row to individualRenders table
    individualRendersTable.row.add({
      "audio": row.audio,
      "audioFilepath": row.audioFilepath,
      "length": row.length,
      "imgSelection": rowImgSelect,
      "padding": rowPaddingSelect,
      "resolution": `<select id='${uploadId}-individual-table-resolution-row-${i}' class="form-control rowRes"></select>`,
    })

    //draw individual renders table
    individualRendersTable.draw();

    //create html options of resolutions based off the default selected image name, and add to ${uploadId}-resolutionSelect
    createResolutionSelect(uploadImageResolutions, upload.files.images[0].name, `${uploadId}-individual-table-resolution-row-${i}`);

    //generate tracklist and length display text
    var currTime = selectedRows[i].length
    //set prevTime
    var prevTime = ''
    if (fullAlbumLength == '') {
      prevTime = '0:00:00'
    } else {
      prevTime = fullAlbumLength
    }
    var currTime = selectedRows[i].length
    console.log('currTime=',currTime)
    startTime = prevTime;
    endTime = sum(startTime, currTime);
    console.log(`startTime=${startTime}, endTime=${endTime}`)
    //calculate sum
    fullAlbumLength = sum(prevTime, currTime);
    console.log(`fullAlbumLength=${fullAlbumLength}`)
    //update tracklist
    fullAlbumTracklist = `${fullAlbumTracklist}${selectedRows[i].audio} ${startTime}-${endTime}<br>`
    console.log(`fullAlbumTracklist=${fullAlbumTracklist} \n`)
  }

  //if selected padding option for row changes, update resolution for that row
  $(`.rowPadding`).on('change', async function () {
    console.log('rowPadding changed')
    //get row info
    let rowId = $(this)[0].id
    let rowNum = (rowId).substr((rowId).lastIndexOf('-') + 1)
    //get image info
    let newImageNum = $(`#${uploadId}-individual-table-image-row-${rowNum}`).val();
    let newImageName = upload.files.images[newImageNum].name;
    //get padding info
    let paddingChoice = $(`#${uploadId}-individual-table-padding-row-${rowNum}`).val();
    //if padding is not 'none', generate dropdown with static resolutions
    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    } else {
      createResolutionSelect(uploadImageResolutions, newImageName, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    }
  })

  //if selected image option for row changes, update resolution for that row
  $(`.rowImg`).on('change', async function () {
    let rowId = $(this)[0].id
    //console.log('rowImg changed for id: ', rowId)
    let rowNum = (rowId).substr((rowId).lastIndexOf('-') + 1)
    //console.log('rowNum: ', rowNum)

    //get image info
    let newImageNum = $(`#${rowId}`).val();
    let newImageName = upload.files.images[newImageNum].name;
    //console.log('newImageName:', newImageName)
    //get padding info
    let paddingChoice = $(`#${uploadId}-individual-table-padding-row-${rowNum}`).val()
    //console.log('paddingChoice:', paddingChoice)

    //if padding is not 'none', generate dropdown with static resolutions
    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    } else {
      createResolutionSelect(uploadImageResolutions, newImageName, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    }

  })

  //set duration
  document.getElementById(`${uploadId}-lengthText`).innerText = fullAlbumLength
  //set tracklist
  document.getElementById(`${uploadId}-tracklistText`).innerHTML = fullAlbumTracklist
}

//helper function to get sum of two timestamps
function sum(date1, date2) {
  date1 = date1.split(":");
  date2 = date2.split(":");
  const result = [];

  date1.reduceRight((carry, num, index) => {
    const max = [24, 60, 60][index];
    const add = +date2[index];
    result.unshift((+num + add + carry) % max);
    return Math.floor((+num + add + carry) / max);
  }, 0);

  return result.map(r => String(r).padStart(2, "0")).join(":");
}

//calcualte resolution
function calculateResolution(oldWidth, oldHeight, newWidth) {
  let aspectRatio = oldWidth / oldHeight;
  let newHeight = newWidth / aspectRatio
  return ([Math.round(newWidth), Math.round(newHeight)])
}

//generate resoltuions based on images
async function getResolutionOptions(images) {
  return new Promise(async function (resolve, reject) {
    try {
      let returnVar = {};
      for (var x = 0; x < images.length; x++) {
        let [width, height] = await ipcRenderer.invoke('get-image-resolution', images[x].path); //await getResolution(images[x].path);
        let resolutions = [];
        resolutions.push(`${width}x${height}`)
        //calculate 640wx480h SD
        let [res1_width, res1_height] = calculateResolution(width, height, 640);
        resolutions.push(`${res1_width}x${res1_height}`)
        //calculate 1280x720 HD
        let [res2_width, res2_height] = calculateResolution(width, height, 1280);
        resolutions.push(`${res2_width}x${res2_height}`)
        //calculate 1920x1080 HD
        let [res3_width, res3_height] = calculateResolution(width, height, 1920);
        resolutions.push(`${res3_width}x${res3_height}`)
        //calculate 2560x1440 HD
        let [res4_width, res4_height] = calculateResolution(width, height, 2560);
        resolutions.push(`${res4_width}x${res4_height}`)

        let temp = {
          'resolutions': resolutions
        }
        returnVar[images[x].name] = temp;
      }
      resolve(returnVar)
    } catch (err) {
      console.log('getResolutionOptions() err = ', err)
    }
  });
}

//generate resolution dropdown html
function createResolutionSelect(uploadImageResolutions, imageName, selectId) {

  //clear options 
  document.getElementById(`${selectId}`).textContent = ``;

  if (uploadImageResolutions == null && imageName == null) {
    uploadImageResolutions = { 'staticResolutions': { resolutions: ['640x480', '1280x720', '1920x1080', '2560x1440', '2560x1600'] } }
    imageName = 'staticResolutions';
  }

  let minAlreadySelected = false;
  for (var x = 0; x < uploadImageResolutions[imageName].resolutions.length; x++) {
    let resolution = `${uploadImageResolutions[imageName].resolutions[x]}`
    let width = parseInt(resolution.split("x")[0]);
    var resOption = document.createElement('option')
    resOption.setAttribute('value', `${imageName}`)
    resOption.setAttribute('style', `width:150px; text-align: left;`)
    //create display text
    let definition = "";
    if (width > 1) {
      definition = 'SD';
      if (width > 1280) {
        definition = '<a class="red_color">HD</a>';

      }
    }
    let displayText = `${resolution} ${definition}`;
    resOption.innerHTML = displayText;

    //select 1920 hd result by default
    if (width >= 1920 && !minAlreadySelected) {
      minAlreadySelected = true;
      resOption.setAttribute('selected', 'selected');
    }
    document.getElementById(`${selectId}`).appendChild(resOption)
  }

};

//create padding div
async function createPaddingSelect(selectId, includeLabel, selectStyle = "", selectClass = "") {
  return new Promise(async function (resolve, reject) {
    //include label if we want to 
    let label = "";
    if (includeLabel) {
      label = "<label>Padding:⠀</label>"
    }

    //create selection form
    var selectForm = `
          <form class="form-inline">
            <div class="form-group">
                ${label}
                <select id='${selectId}' class="form-control ${selectClass}" style="${selectStyle}"> 
                  <option value="none">None</option>
                  <option value="white">White</option>
                  <option value="black">Black</option>
                </select> 
            </div>
          </form>`;

    //return html
    resolve(selectForm)
  })
}

//create resolution div
async function createResolutionSelectIndividualCol(selectId, includeLabel, selectStyle = "") {
  return new Promise(async function (resolve, reject) {
    //include label if we want to 
    let label = "";
    if (includeLabel) {
      label = "<label>Resolution:⠀</label>"
    }

    //create selection form
    var selectForm = `
          <form class="form-inline">
            <div class="form-group">
                ${label}
                <select id='${selectId}' class="form-control" style="${selectStyle}"> 
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4" selected>4</option>
                  <option value="5">5</option>
                </select> 
            </div>
          </form>`;

    //return html
    resolve(selectForm)
  })
}

//create select div with an option for each image
async function createImgSelect(images, selectId, includeLabel, selectStyle = "", selectClass = "") {
  return new Promise(async function (resolve, reject) {
    //include label if we want to 
    let label = "";
    if (includeLabel) {
      label = "<label>Img:⠀</label>"
    }

    //create an option for each img
    var imageSelectionOptions = ``
    for (var x = 0; x < images.length; x++) {
      var imageFilename = `${images[x].name}`
      imageSelectionOptions = imageSelectionOptions + `<option value="${x}">${imageFilename}</option>`
    };

    //create img selection form
    var imgSelectionSelect = `
      <form class="form-inline">
        <div class="form-group">
            ${label}
            <select id='${selectId}' class="form-control ${selectClass}" style="${selectStyle}">`; //style="height:40px;max-width: 150px;"


    imgSelectionSelect = `${imgSelectionSelect} ${imageSelectionOptions} </select> 
        </div>
      </form>`;

    //return html
    resolve(imgSelectionSelect)
  })
}

//create dataset for the table in an upload
async function createFilesTableDataset(uploadFiles, uploadId, upload) {
  return new Promise(async function (resolve, reject) {
    //create img selection part of form
    /*
    var imageSelectionOptions = ``
    try {
      //for each image
      for (var x = 0; x < uploadFiles.images.length; x++) {
        var imagFilename = `${uploadFiles.images[x].name}`
        imageSelectionOptions = imageSelectionOptions + `<option value="${x}">${imagFilename}</option>`
      }
    } catch (err) {

    }
    */

    //create dataset
    let dataSet = []
    let fileCount = 1;
    try {
      //for each audio file
      for (var x = 0; x < uploadFiles['audio'].length; x++) {
        var audioObj = uploadFiles['audio'][x]

        /*
        //create img selection form
        let imgSelectionSelect = await createImgSelect(upload, `${uploadId}_table-audio-${x}-img_choice`, false)
        //create vid output selection
        var videoOutputSelection = `
              <select id='${uploadId}_table-vidFormat-row_${x}'>
                  <option value="0">mp4</option>
                  <option value="1">avi</option>
              </select> 
              `; 
        */

        //create row obj
        let rowObj = {
          itemId: fileCount,
          audio: audioObj.name,
          format: audioObj.type,
          length: audioObj.length,
          audioFilepath: audioObj.path,
          trackNum: audioObj.trackNum,
          album: audioObj.album,
          year: audioObj.year,
          artist: audioObj.artist,
        }
        fileCount++
        dataSet.push(rowObj)
      }
    } catch (err) {

    }

    resolve(dataSet)
  })
}

//datatables natural sort plugin code below:
(function () {

  /*
   * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
   * Author: Jim Palmer (based on chunking idea from Dave Koelle)
   * Contributors: Mike Grier (mgrier.com), Clint Priest, Kyle Adams, guillermo
   * See: http://js-naturalsort.googlecode.com/svn/trunk/naturalSort.js
   */
  function naturalSort(a, b, html) {
    var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?%?$|^0x[0-9a-f]+$|[0-9]+)/gi,
      sre = /(^[ ]*|[ ]*$)/g,
      dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
      hre = /^0x[0-9a-f]+$/i,
      ore = /^0/,
      htmre = /(<([^>]+)>)/ig,
      // convert all to strings and trim()
      x = a.toString().replace(sre, '') || '',
      y = b.toString().replace(sre, '') || '';
    // remove html from strings if desired
    if (!html) {
      x = x.replace(htmre, '');
      y = y.replace(htmre, '');
    }
    // chunk/tokenize
    var xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
      yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
      // numeric, hex or date detection
      xD = parseInt(x.match(hre), 10) || (xN.length !== 1 && x.match(dre) && Date.parse(x)),
      yD = parseInt(y.match(hre), 10) || xD && y.match(dre) && Date.parse(y) || null;

    // first try and sort Hex codes or Dates
    if (yD) {
      if (xD < yD) {
        return -1;
      }
      else if (xD > yD) {
        return 1;
      }
    }

    // natural sorting through split numeric strings and default strings
    for (var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
      // find floats not starting with '0', string or 0 if not defined (Clint Priest)
      var oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc], 10) || xN[cLoc] || 0;
      var oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc], 10) || yN[cLoc] || 0;
      // handle numeric vs string comparison - number < string - (Kyle Adams)
      if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
        return (isNaN(oFxNcL)) ? 1 : -1;
      }
      // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
      else if (typeof oFxNcL !== typeof oFyNcL) {
        oFxNcL += '';
        oFyNcL += '';
      }
      if (oFxNcL < oFyNcL) {
        return -1;
      }
      if (oFxNcL > oFyNcL) {
        return 1;
      }
    }
    return 0;
  }

  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "natural-asc": function (a, b) {
      return naturalSort(a, b, true);
    },

    "natural-desc": function (a, b) {
      return naturalSort(a, b, true) * -1;
    },

    "natural-nohtml-asc": function (a, b) {
      return naturalSort(a, b, false);
    },

    "natural-nohtml-desc": function (a, b) {
      return naturalSort(a, b, false) * -1;
    },

    "natural-ci-asc": function (a, b) {
      a = a.toString().toLowerCase();
      b = b.toString().toLowerCase();

      return naturalSort(a, b, true);
    },

    "natural-ci-desc": function (a, b) {
      a = a.toString().toLowerCase();
      b = b.toString().toLowerCase();

      return naturalSort(a, b, true) * -1;
    }
  });

}());

//open url in user's default browser
async function openUrl(type) {
  var open = require("open");
  if(type=='github') {
      open("https://github.com/MartinBarker/rendertune/");
  }else if(type=='web'){
      open('https://martinbarker.me/rendertune')
  }

  
  
}