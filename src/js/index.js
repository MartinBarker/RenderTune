const { Console } = require('console');
const { resolve } = require('path');
const { ipcRenderer } = window.require('electron');
const { join } = window.require('path');
var path = require('path');
const execa = window.require('execa');

//get ffmpeg path and send it to main.js first thing
initSetFfmpegPath()
async function initSetFfmpegPath(){
  let ffmpegPath = await getFfPath('ffmpeg')
  ipcRenderer.invoke('set-ffmpeg-path', ffmpegPath);
}

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
        
        //calculate image file size and display as either kb or mb
        let imgSize = '';
        if(f.size/1000000 >= 1){
          //display as mb rounded to 1 digit
          imgSize=`${(f.size/1000000).toFixed(1)} mb`
        }else{
          //display as kb rounded to 1 digit
          imgSize=`${(f.size/100).toFixed(1)} mb`
        }

        //get image resolution
        let [width, height] = await ipcRenderer.invoke('get-image-resolution', f.path);
        let imgResolution = `${width}x${height}`

        NewUploadFiles.images.push({ 
          'path': f.path, 
          'type': f.type, 
          'name': f.name, 
          'size': imgSize, 
          'resolution': imgResolution 
        })
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
      console.log(`newUploadFileDropEvent() length=`,audioFileInfo.length)

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

//call electron main.js to set custom port
async function setCustomPort(port) {
  const rsp = await ipcRenderer.invoke('set-custom-port', port);
  return rsp;
}

//call electron main.js to get image colors
async function getImageColors(filename) {
  //console.log('getImageColors() filename=',filename)
  var swatches = '';
  try{
    swatches = await ipcRenderer.invoke('get-image-colors', filename);
  }catch(err){
    console.log('getImageColors err=',err)
  }
  

  return swatches;
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

async function getSelectedImageIndex(uploadId){
  return new Promise(async function (resolve, reject) {
    let uploads = await JSON.parse(localStorage.getItem('uploadList'))
    console.log('getSelectedImageIndex() uploads=',uploads)
    //if no image is selected, set zero as default

    resolve(uploads[uploadId].selectedImgIndex ? uploads[uploadId].selectedImgIndex : 0); 
  })
}


//when main image choice for uploads[uploadId] is changed
async function handleMainImageOptionChange(upload, uploadId, imageFilepath, imgIndex){
    console.log('handleMainImageOptionChange(), setting selected img to ',imgIndex)  
    //retrieve uploads and set selected image
    let tmpUploads = await JSON.parse(localStorage.getItem('uploadList'))
    tmpUploads[uploadId].selectedImgIndex = imgIndex
    await setLocalStorage('uploadList', tmpUploads)
    //get padding choice
    let paddingChoice = $(`#${uploadId}-paddingSelect`).val();
    //generate new resolution options
    let uploadImageResolutions = await getResolutionOptions(upload.files.images);
    
    //create image hex color choices html
    var [imgColorRecomendationsHTML, colorData] = await createPaddingImgColors(upload.files.images, uploadId, `${uploadId}-paddingImgColors`)
    //update html
    document.getElementById(`${uploadId}-paddingImgColors`).innerHTML=imgColorRecomendationsHTML

    //determine if we need to act upon the padding choice
    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-resolutionSelect`);
    } else {
      //newResOptions = generateResolutionOptions(uploadImageResolutions, newImageName);
      createResolutionSelect(uploadImageResolutions, imageFilepath, `${uploadId}-resolutionSelect`);
    }
}

function determineBackgroundColor(item){
  console.log('item.val=',item.val)
  if(item.val.toLowerCase().trim()!='custom'&&item.val.toLowerCase().trim()!='none'){
    item.style.backgroundColor=item.value
  }else{
    item.style.backgroundColor=white
  }
}

//create html for Upload view
async function createUploadPage(upload, uploadId) {
  console.log('createUploadPage() begin, upload=',upload)
  //create image gallery container
  let images = [];
  for (var z = 0; z < upload.files.images.length; z++) {
    let img = upload.files.images[z]
    images.push(`<img src="${img.path}" data-caption="${img.name}">`)
  }

  //create image hex color choices html
  var [imgColorRecomendations, coloData] = await createPaddingImgColors(upload.files.images, uploadId, `${uploadId}-paddingImgColors`)
  console.log('createUploadPage() imgColorRecomendations=',imgColorRecomendations)
  console.log('coloData=',coloData)

  //set default padding color picker value
  let defaultColorPickerValue = coloData[0];
  console.log('defaultColorPickerValue=',defaultColorPickerValue)

  //create new image <select> with img previews
  let imageSelectionHTML = await createImgSelectPreview(upload.files.images, `${uploadId}-imgSelect`)

  //add html to page
  let audioFilesCount = upload.files.audio.length;
  let imageFilesCount = upload.files.images.length;
  await $("#upload-pages-container").append(`
    <div class="col-lg-12 upload">
      <!-- Upload Header Details -->
      <div>
        <!-- Upload Title -->
        <a id='uploadTitle'><strong>${upload.title}</strong></a> 
        <!-- Image Files -->
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
                  <th style='min-width: 25px!important; width: 25px!important; max-width:25px;!important'>#</th>
                  
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
        
        <!------------------------------ 
        Image Selection Option
        ------------------------------->
        <div class="col-lg-4 settingsCol">
          <div class="form-group">
            <span>
              <label for="size">Image:
                <i class="fa fa-question-circle" data-delay='{"show":"5000", "hide":"3000"}' aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Chosen image that will be combined with audio to render a video."></i>
              </label>
              ${imageSelectionHTML}
            </span>
          </div>
        </div>

        <!------------------------------ 
        Padding Selection Option
        ------------------------------->
        <div class="col settingsCol" >
          <div class="form-group">
            <span>
              <label for="size">Padding:
                <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="If a padding option is selected, than the image will be padded to reach its resolution."></i>
              </label>
              <select onChange="
              
                (this.value!='custom'&&this.value!='Custom'&&this.value!='white'&&this.value!='White'&&this.value!='none'&&this.value!='None')?(this.style.backgroundColor=this.value):(this.style.backgroundColor='white');
              
                this.style.backgroundColor=this.value;
                
              
                " id='${uploadId}-paddingSelect' class="form-control">
                
                <option bgColor="white" txtColor="black" value="none">None</option>
                <option bgColor="white" txtColor="black" value="white">White</option>
                <option bgColor="black" txtColor="white" value="black">Black</option>
                <option value="custom">Custom</option>
              </select>
            </span>
          </div>
        </div>

        <!------------------------------ 
        Resolution Selection Option
        ------------------------------->
        <div class="col settingsCol" >
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

        <!------------------------------ 
        Output Folder Option
        ------------------------------->
        <div class="col settingsCol changeDirButton" id='${uploadId}-changeDirDiv' >
          <div class="form-group">
            <span>
              <label for="size">Output Dir: 
                <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Output folder where we will render the video."></i>
              </label>
              <div id='${uploadId}-dirText' onClick='changeDir("${uploadId}-dirText", "${uploadId}")' class="changeDir">
                <i class="fa fa-folder" aria-hidden="true"></i>  ${upload.outputFolder}
              </div>
            </span>
          </div>
        </div>

        <!------------------------------ 
        Output Video Format Option [mkv / mp4]
        ------------------------------->
        <div class="col settingsCol" >
          <div class="form-group">
            <span>
              <label for="size">Output Vid:
                <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Choose what file type you want the outputted video(s) to be. Mkv will have higher quality audio."></i>
              </label>
              <select id='${uploadId}-vidFormatSelect' class="form-control">
                <option value="mkv">mkv</option>
                <option value="mp4">mp4</option>
              </select>
            </span>
          </div>
        </div>
        <!-- /settings -->


        </div>
      </div>

    </div> 
    
    <!-- Padding Color Picker Card (hidden by default) -->
      <div id='${uploadId}-paddingColorPicker'  class="card" style="
      left: 15px;
      margin-bottom: 10px;
      width: 100%;
      display:none;
      margin-right: 50px;">
        <div class="card-header">
          Padding Color Picker <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Pick a custom hexadecimal color to fill in your video background."></i>
        </div>
        <div class="card-body">

          <p class="card-text">
            Pick a color to add as a padding option for this upload.
          </p>
          
          <!-- image based color recomendations -->
          ${imgColorRecomendations}

          <!-- color picker -->
          <div>
            <!-- To select the color -->
            Color Picker: <input type="color" class='colorPicker' id="${uploadId}-colorPicker" value="${defaultColorPickerValue}">
      
            <!-- To display hex code of the color -->
            Hex Code:  <input type="text" class='hexColorBox' value='${defaultColorPickerValue}' id="${uploadId}-hexColorBox"> 
          </div>
          <br>

          <!-- color adder button -->
          <div 
            class='border addCustomColor' 
            onClick='addCustomColorOption("${uploadId}")'
          >
            <i 
              href="#" 
              class="fa fa-plus-circle" 
              aria-hidden="true"
            ></i>
            Add custom color padding option
          </div>

          <!-- color picker code -->
          <script>

              //function to call when hex text input changes
              function hexColorBoxChanged(){
                //set color picker value to hexColorBox value
                document.getElementById('${uploadId}-colorPicker').value = document.getElementById('${uploadId}-hexColorBox').value;
              }
              
              //function to call when hex color picker value changes
              function hexColorPickerValueChanged() {
                  // Get the value return by color picker
                  var color = document.getElementById('${uploadId}-colorPicker').value;
        
                  // Take the hex code
                  document.getElementById('${uploadId}-hexColorBox').value = color;
              }
        
              // add event listener so that when user clicks over color picker, hexColorPickerValueChanged() function is called
              document.getElementById('${uploadId}-colorPicker').addEventListener('input', hexColorPickerValueChanged);

              // add event listener so that when user changes color hex value, hexColorBoxChanged() function is called
              document.getElementById('${uploadId}-hexColorBox').addEventListener('input', hexColorBoxChanged);

          </script>
          
          <!-- color picker style -->
          <style>
              /* style */
              .${uploadId}-imgSelect{
                display: contents;
              }

            .colorPicker {
                background-color: none;
                outline: none;
                border: none;
                height: 40px;
                width: 60px;
                cursor: pointer;
            }
              
            .hexColorBox {
              outline: none;
              border: 1px solid #333;
              height: 25px;
              width: 120px;
              padding: 0 10px;
              padding-top: 8px;
              padding-bottom: 10px;
              bottom: 23px !important;
              position: block;
            }
          </style>


        </div>
      </div>
      <br>

      
    <h4 style='padding-left: 15px;'>Renders:</h4>

    <!-- Full Album Upload Card -->
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

    <!-- Individual Upload(s) Card -->
    <div class="card" style="left: 15px;
    width: 100%;
    z-index: 1;
    margin-right: 50px;">
      <div class="card-header">
        Render <a class='${uploadId}-numSelected'>0</a> individual videos <i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Keep everything as default or use the Batch Render Options to change any settings before clicking the 'Render' button to batch render multiple videos"></i>
      </div>
      <div class="card-body" style="overflow: overlay;">
      
      <p class="card-text">
      Batch Render Options:
      </p>

      <!-- individual renders table -->
      <div class=''>
        <table id="${uploadId}-individual-table" class="individTable table table-sm table-bordered scroll display filesTable" cellspacing="2" width="100%">
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
                    <label>Img:</label><br>
                    <div id='${uploadId}-individual-table-image-col'>
                        
                    </div>
                  </th>

                  <!-- Padding Selection -->
                  <th class='left-align-col' style="width:20px!important" >
                    <div id='${uploadId}-individual-table-padding-col' >
                      <label>Padding:</label>
                    </div>
                  </th>

                  <!-- Resolution Selection -->
                  <th class='left-align-col' style="width: 150px !important;" >
                    <div id='${uploadId}-individual-table-resolution-col' >
                      <label>Resolution:</label><br>
                    </div>
                  </th>
                  
                  <!-- Output Video Format Option [mkv / mp4] -->
                  <th class='left-align-col' style='width:20px!important;' >
                    <div id='${uploadId}-individual-table-output-vid-col' >
                      <label>Output Vid:</label>
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
  createResolutionSelect(uploadImageResolutions, upload.files.images[0].path, `${uploadId}-resolutionSelect`);

  //
  //  jQurey code to handle when certain options change on an upload page
  //

  //if user changes color box text value, remove green border
  $(`#${uploadId}-hexColorBox`).keyup(function () { 
    $(".colorBox").removeClass("selectedColorBox");
  });

   //if user sets color using color picker, remove green border
  $(`#${uploadId}-colorPicker`).on('change', async function () {
    $(".colorBox").removeClass("selectedColorBox");
  });

  //jQuery setup to display images inside <select> <option> elements for main image selection
  $(`#${uploadId}-imgSelect`).ddslick({
    width:'flex',
    background: '#FFFFFF',
    onSelected: async function(selectedData){
      handleMainImageOptionChange(upload, uploadId, upload.files.images[selectedData.selectedIndex].path, selectedData.selectedIndex);
    }   
  });

  //if padding changes for main upload:
  //update resolution options, update css for padding options
  let runOnlyOnce=true;
  $(`#${uploadId}-paddingSelect`).on('change', async function () {
    console.log(`#${uploadId}-paddingSelect on change`)
    //get new chosen padding (string)
    let paddingChoice = $(this).val();
    console.log('main padding changed. paddingChoice=',paddingChoice)
    //go through each option and update css:
    if (['none', 'black', 'white'].indexOf(paddingChoice.toLowerCase().trim()) < 0) {
      //select first color default value if selectedColorBox class does not exit anywhere
      if(document.querySelectorAll('.selectedColorBox').length==0 && runOnlyOnce){
        $(".colorBox")[0].click();
        runOnlyOnce=false;
      }
      
      //reveal custom HEX color picker
      document.querySelector(`#${uploadId}-paddingColorPicker`).style.display='block';

    }else{
      //else option is 'custom' or 
      document.querySelector(`#${uploadId}-paddingColorPicker`).style.display='none';
      //remove style
      $(`#${uploadId}-paddingSelect select`).css({
        "background": "",
        "outline":"",
        "background":``,
        "color":"",
        "text-shadow":"",
      });
    }


    //update padding options

    //get image choice index from global var
    let selectedImgIndex = await getSelectedImageIndex(uploadId) 
    let newImagePath = upload.files.images[selectedImgIndex].path;
    //generate new resolution options
    let uploadImageResolutions = await getResolutionOptions(upload.files.images);

    //if padding is not 'none'
    if (!paddingChoice.includes('none')) {
      //update resolution options
      createResolutionSelect(null, null, `${uploadId}-resolutionSelect`);
    } else {
      //newResOptions = generateResolutionOptions(uploadImageResolutions, newImageName);
      createResolutionSelect(uploadImageResolutions, newImagePath, `${uploadId}-resolutionSelect`);
    }

    //UPDATE CSS COLORS for each option:
    updatePaddingSelectCss(`${uploadId}-paddingSelect`)

  });

  //if output dir changes
  $(`${uploadId}-outputSelect`).bind("change paste keyup", function () {
    
  });

  //update main padding css
  updatePaddingSelectCss(`${uploadId}-paddingSelect`)

  console.log('createUploadPage() end, upload=',upload)

}

async function updatePaddingSelectCss(selectId){
  console.log(`updatePaddingSelectCss(${selectId})`)
  //update css for each each option preview
  $(`#${selectId} > option`).each(function() {
    this.value=(this.value).trim().toLowerCase()
    //console.log('   updating css for select option with value:  ', this.value);
    //if value does not need custom css (not 'none' or 'custom' or 'white'):
    if(this.value == 'none' || this.value == 'custom' || this.value == 'white'){
      //console.log('   colorProfile1');
      //black text on white background
      this.style.color = "black";
      this.style.background = 'white';
    
    }else if(this.value == 'black'){ //else if color is black
      //console.log('   colorProfile2');
      //white text black background
      this.style.color='white'
      this.style.background='black'

    }else{ 
      console.log('   colorProfile3 setting custom colors and visible text for: ', this.value);
      //calcualte most visible text color
      let mostVisibleTextColor = getMostReadableTextColor(this.value)
      //custom colors
      this.setAttribute('style',`background:${this.value};color:'${mostVisibleTextColor}';`)
    }
   
  });
}

async function getMostReadableTextColor(hex) {
  return new Promise(async function (resolve, reject) {
    let rgb = convertHexToRGB(hex)
    if (((rgb[0]) * 0.299 + (rgb[1]) * 0.587 + (rgb[2]) * 0.114) > 186) {
      console.log(`getMostReadableTextColor(${hex}) returning black`)
      resolve("black")
    } else {
      console.log(`getMostReadableTextColor(${hex}) returning white`)
      resolve("white")
    }
  })
}

async function convertHexToRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}


//add custom padding color option to full album render AND indvidual render padding options
async function addCustomColorOption(uploadId){
  //get selected color
  let selectedColor = document.getElementById(`${uploadId}-hexColorBox`).value;
  console.log('addCustomColorOption() selectedColor=',selectedColor)

  //create new padding color option html
  var newPaddingOption = `
  <option 
      style="
        outline:#cc4242 11px -13px 10px;
        background:${selectedColor};
        color:#fff;
        text-shadow:1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, -1px 0 0 #000;
      " 
      value="${selectedColor}"
      >${selectedColor}
  </option>`

  //add new padding color option html to main padding select
  $(`#${uploadId}-paddingSelect`).append(newPaddingOption);

  //select this newly added option
  $(`#${uploadId}-paddingSelect option`).filter(function() {
    return $(this).text().trim() == selectedColor;
  }).prop('selected', true);
  
  //add new padding color to individ renders table col header
  $(`#${uploadId}-individual-table-padding-col select`).append(newPaddingOption);
  //add new padding color to individ renders table rows
  var table = $(`#${uploadId}-individual-table`).DataTable()
  var rows = table.rows().data()
  for(var x = 0; x < rows.length; x++){
    $(`#${uploadId}-individual-table-padding-row-${x}`).append(newPaddingOption);
  }

  //fire off change event
  $(`#${uploadId}-paddingSelect`).change();

  //update color display:
  updatePaddingSelectCss(`${uploadId}-paddingSelect`)
}

async function colorBoxClicked(element, uploadId){
  $(".colorBox").removeClass("selectedColorBox");
  element.classList.add("selectedColorBox");
  let selectedColor = element.getAttribute('title')
  console.log('selectedColor=',selectedColor)
  //set hex color box value
  document.getElementById(`${uploadId}-hexColorBox`).value = selectedColor;
  //set hex color picker text  
  document.getElementById(`${uploadId}-colorPicker`).value = selectedColor;
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
      // get audio filepath for that row
      //
      //get audio input filepath
      let audioInputPath = row.audioFilepath;
      console.log('audioInputPath=', audioInputPath)

      //
      // get image filepath for that row
      //
      //GET ID WE WILL USE TO GET IMAGE SELECTON RESULT FOR THAT ROW
      //let imageLocationId = row.imgSelection.split(`id=`)[1].substring(1)
      //imageLocationId = imageLocationId.substring(0, imageLocationId.indexOf(`'`)).trim()

      //get image selection form:
      //console.log(` get row at index: ${x} imageSelection: `, document.querySelector(`#${uploadId}-individual-table-image-row-${x}`))

      //get image input filepath
      //let indexValueImgChoice = document.querySelector(`#${imageLocationId}`).value;
      let indexValueImgChoice = $(`#${uploadId}-individual-table-image-row-${x}`).find('input[type=hidden]:first').val()

      //get img name
      let imageFilepath = upload.files.images[indexValueImgChoice].path

      //
      //get resolution choice for that row
      //
      let resolutionLocationId = row.resolution.split(`id=`)[1].substring(1)
      resolutionLocationId = resolutionLocationId.substring(0, resolutionLocationId.indexOf(`'`)).trim()
      let resolution = ($(`#${resolutionLocationId} :selected`).text()).split(" ")[0];

      //
      //get padding choice
      //
      let paddingLocationId = row.padding.split(`id=`)[1].substring(1)
      paddingLocationId = paddingLocationId.substring(0, paddingLocationId.indexOf(`'`)).trim()
      let padding = $(`#${paddingLocationId}`).val();

      //get output vid format choice
      let outputVidLocationId = row.outputVid.split(`id=`)[1].substring(1)
      outputVidLocationId = outputVidLocationId.substring(0, outputVidLocationId.indexOf(`'`)).trim()
      let outputVid = $(`#${outputVidLocationId}`).val();

      //get outputDir and uploadName
      let outputDir = uploads[uploadId].outputDir;
      let uploadName = uploads[uploadId].title;

      //if audio file is not of type mp3, then convert to mp3:
      let audioType = audioInputPath.substr(audioInputPath.lastIndexOf('.'))
      let concatAudioChoice = false
      if(audioType!='mp3'){
        concatAudioChoice = true
      }

      //create outputFilename from row audio
      let filename = row.audio
      //remove filename ending
      filename=filename.substr(0, filename.lastIndexOf("."))
      //clean audio filename to make sure there aren't any special chars
      filename.replace(/[/\\?%*:|"<>]/g, '-');
      
      //get audio file length
      let hms = row['length'];
      console.log('hms=',hms)
      var [hours, minutes, seconds] = `${hms}`.split(':');
      console.log(`hours, minutes, seconds ${hours} ${minutes} ${seconds}`)
      var outputDuration = (+hours) * 60 * 60 + (+minutes) * 60 + (+seconds);
      console.log(`outputDuration = ${outputDuration}`);

      //create renderOptions object we will send to render() function
      let renderOptions2 = {
        //upload data
        uploadNumber: uploadNumber,
        uploadId: uploadId,
        uploadName: uploadName,
        //input files data
        inputImage: imageFilepath,
        inputAudioFilepaths: [audioInputPath],
        //video options 
        resolution: resolution,
        padding: padding,
        //output data
        
        outputDuration: outputDuration, ////////

        outputDir: outputDir,
        outputFormat: outputVid,
        outputFilepath: `${outputDir}${path.sep}${filename}-${(Date.now().toString()).substring(7)}.${outputVid}`
      }

      await render(renderOptions2)
      
    }
  }

}

//call when 'Render' button for concat full album is clicked
async function concatRenderPrep(uploadId, uploadNumber) {
  //get all uploads
  let uploads = await JSON.parse(localStorage.getItem('uploadList'))
  //get upload info we will be rendering
  let upload = uploads[uploadId];
  //get selected resolution
  let resolution = $(`#${uploadId}-resolutionSelect option:selected`).text();
  resolution = (resolution.split(" ")[0]).trim()
  //get selected padding 
  let padding = $(`#${uploadId}-paddingSelect option:selected`).text();
  //get selected main image index from global var
  let imgChoice = await getSelectedImageIndex(uploadId)
  //get selected main image filepath
  let imageFilepath = upload.files.images[imgChoice].path
  //get tracks table
  var table = $(`#${uploadId}_table`).DataTable()
  //get all selected rows from main table
  var selectedRows = table.rows('.selected').data()
  //get audio filepath for each selected row and calculate output video duration seconds
  var inputAudioFilepaths = []
  var outputDuration = 0
  for(var x = 0; x < selectedRows.length; x++) {
    //push audio input filepath
    inputAudioFilepaths.push(`${selectedRows[x].audioFilepath}`);
    //calculate total time
    //var lengthSplit = selectedRows[x].length.split(':'); // split length at the colons
    //var seconds = (+lengthSplit[0]) * 60 * 60 + (+lengthSplit[1]) * 60 + (+lengthSplit[2]);
    //console.log(`selectedRows[${x}].length = ${selectedRows[x].length}, \n lengthSplit=${lengthSplit} \n seconds=${seconds}, \n outputDuration=${outputDuration} \n \n `)
    let trackLengthSeconds = await ipcRenderer.invoke('get-audio-length', selectedRows[x].audioFilepath);
    //round 
    trackLengthSeconds=Math.round(trackLengthSeconds)
    outputDuration = outputDuration + trackLengthSeconds;
    //outputDuration = outputDuration + trackLengthSeconds;


    //console.log(`NEWAUDIOLENGTH! ${selectedRows[x].audioFilepath} LENGTH=`,newAudioLength)
  }
  console.log('newTime outputDuration=',outputDuration)
  //get selected video output format 
  let vidFormat = $(`#${uploadId}-vidFormatSelect option:selected`).text();
  //get selected outputDir
  let outputDir = uploads[uploadId].outputDir;
  //if outputDir == unset, turn button red and reveal err message to user
  if(!outputDir){
    //set color of changeDir button
    document.querySelector(`#${uploadId}-dirText`).style.backgroundColor = "#fc3535";
    //reveal message
    document.querySelector(`#${uploadId}-concatRenderMsg`).style.visibility='visible';
  }else{ //else if outputDir is set
    //get uploadName
    let uploadName = uploads[uploadId].title;

    //create renderOptions object we will send to render() function
    let renderOptions = {
      //upload data
      uploadNumber: uploadNumber,
      uploadId: uploadId,
      uploadName: uploadName,
      //input files data
      inputImage: imageFilepath,
      inputAudioFilepaths: inputAudioFilepaths,
      //video options 
      resolution: resolution,
      padding: padding,
      //output data
      outputDuration: outputDuration,
      outputDir: outputDir,
      outputFormat: vidFormat,
      outputFilepath: `${outputDir}${path.sep}concatVideo-${(Date.now().toString()).substring(7)}.${vidFormat}`
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
    console.log('render() function called. renderOptions=', renderOptions)
    ///////////////////////////////////
    //create video rendering command
    let cmdArr = []
    cmdArr.push('-loop')
    cmdArr.push('1')
    cmdArr.push('-framerate')
    cmdArr.push('2')
    //image input
    cmdArr.push('-i')
    cmdArr.push(`${renderOptions.inputImage}`)
    //audio input(s)
    for(var x=0; x < renderOptions.inputAudioFilepaths.length; x++){
      cmdArr.push('-i')
      cmdArr.push(`${renderOptions.inputAudioFilepaths[x]}`)
    }
    //audio codec depending on output video format
    if(renderOptions.outputFormat == 'mkv'){
      cmdArr.push('-c:a')
      cmdArr.push('pcm_s32le')
    }else if(renderOptions.outputFormat == 'mp4'){
      cmdArr.push('-c:a')
      cmdArr.push('libmp3lame')
      cmdArr.push('-b:a')
      cmdArr.push('320k')
    }else{
      throw 'invalid output video format selected'
    }
    //filter to concatenate audio
    cmdArr.push('-filter_complex')
    cmdArr.push(`concat=n=${renderOptions.inputAudioFilepaths.length}:v=0:a=1`)
    //video codec
    cmdArr.push('-vcodec')
    cmdArr.push('libx264')
    //buffer size
    cmdArr.push('-bufsize')
    cmdArr.push('3M')
    //filter to set resolution/padding
    cmdArr.push('-filter:v')
    //if user has no padding option selected, render vid to exact width/height resolution 
    if(renderOptions.padding.toLowerCase().trim() == 'none'){
      cmdArr.push(`scale=w=${renderOptions.resolution.split('x')[0]}:h=${renderOptions.resolution.split('x')[1]},pad=ceil(iw/2)*2:ceil(ih/2)*2`)
    //else padding will be padding hex(#966e6e) color 
    }else{ 
      //get hex color
      var paddingColor = '';
      if(renderOptions.padding.toLowerCase().trim()=='white'){
        paddingColor='#ffffff'
      }else if(renderOptions.padding.toLowerCase().trim()=='black'){
        paddingColor='#000000'
      }else{
        paddingColor=renderOptions.padding
      }
      cmdArr.push(`format=rgb24,scale=w='if(gt(a,1.7777777777777777),${renderOptions.resolution.split('x')[0]},trunc(${renderOptions.resolution.split('x')[1]}*a/2)*2)':h='if(lt(a,1.7777777777777777),${renderOptions.resolution.split('x')[1]},trunc(${renderOptions.resolution.split('x')[0]}/a/2)*2)',pad=w=${renderOptions.resolution.split('x')[0]}:h=${renderOptions.resolution.split('x')[1]}:x='if(gt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[0]}-iw)/2)':y='if(lt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[1]}-ih)/2)':color=${paddingColor}`)
    }
    //crf
    cmdArr.push('-crf')
    cmdArr.push('18')
    //pix_fmt
    cmdArr.push('-pix_fmt')
    cmdArr.push('yuv420p')
    //shortest
    cmdArr.push('-shortest')
    //stillimage
    cmdArr.push('-tune')
    cmdArr.push('stillimage')
    
    //set video length (seconds) to trim ending
    cmdArr.push('-t')
    cmdArr.push(`${renderOptions.outputDuration}`)

    //output
    cmdArr.push(`${renderOptions.outputFilepath}`)

    console.log('cmdArr = ', cmdArr)

    //add to renderList
    var renderStatusId = `${renderOptions.uploadId}-render-${((Date.now().toString()).substring(7).toString()).substring(7)}`;
    addToRenderList('video', renderOptions.outputDuration, renderOptions.uploadName, renderOptions.outputDir, renderOptions.outputFilepath, renderStatusId)
    //run ffmpeg command to render video

    console.log('render() calling runFfmpegCommand for cmdArr=',cmdArr, ', renderOptions.outputDuration=',renderOptions.outputDuration );
    let runFfmpegCommandResp = await runFfmpegCommand(cmdArr, renderOptions.outputDuration, renderStatusId);

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
  });

  //if a row is clicked
  $(`#renders-table tbody`).on('click', 'tr', function () {
    //determine whether or not to select/deselect & check/uncheck row
    var isSelected = $(this).hasClass('selected')
    $(this).toggleClass('selected').find(':checkbox').prop('checked', !isSelected);
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
    console.log('runFfmpegCommand() ffmpegPath=',ffmpegPath, ', ffmpegArgs=',ffmpegArgs, ', cutDuration=',cutDuration)
    console.log(ffmpegArgs.join(" "))
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
      console.log('line=',line)
      let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      
      console.log('match=',match)
      // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
      if (!match){
        console.log('no match 1')
        match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      }
      
      let startOfLine = line.substring(0,6)
      console.log(`startOfLine=${startOfLine}`)


      var displayProgress=0


      //if line begins with 'video:' then video has finished
      if(startOfLine.includes('video:')){
        console.log('line starts with video: so it is finished')
        displayProgress=100
        for (var z = 0; z < renderList.length; z++) {
          //update render status to be 'done'
          if (renderList[z].renderStatusId == renderStatusId) {
            renderList[z].status = 'done'
          }
          //update render modal display
          updateRendersModal()
        }

      }else{
        if (!match){
          console.log('no match 2, return')
          return
        }
        const str = match[1];
        console.log('str=',str)
        const progressTime = Math.max(0, moment.duration(str).asSeconds());
        const progress = cutDuration ? progressTime / cutDuration : 0;
        displayProgress = parseInt(progress * 100)
      }


      

      console.log('displayProgress=',displayProgress)
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
  console.log('read line handle progress finished')
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
    
    scrollResize: true,
    //scrollY: 100,
    scrollCollapse: true,

    columns: [
      { "data": "audio" },
      { "data": "audioFilepath" }, //invisible
      { "data": "length" },
      { "data": "imgSelection" },
      { "data": "padding" },
      { "data": "resolution" },
      { "data": "outputVid" },
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
      { targets: 6, sortable: false },

    ],
    "language": {
      "emptyTable": "No files selected"
    },
    dom: 'rt',

  });

  //create img selection col header and add it to table
  //let imgSelect = await createImgSelect(upload.files.images, `${uploadId}-individual-table-image-col`, true, 'max-width: 150px;')
  
  let newImgSelect = await createImgSelectPreview(upload.files.images, `${uploadId}-individual-table-image-col`)
  document.getElementById(`${uploadId}-individual-table-image-col`).innerHTML = newImgSelect;
  //jQuery setup to display images inside <select> <option> elements for main image selection
  $(`#${uploadId}-individual-table-image-col`).ddslick({
    width:'flex',
    background: '#FFFFFF',
    onSelected: async function(selectedData){
      //get current value
      let selectedIndex = selectedData.selectedIndex
      console.log('individ table image col changed: ', selectedIndex)
      //get the number of selected rows
      var table = $(`#${uploadId}-individual-table`).DataTable()
      var rows = table.rows().data()
      //set all values 
      for(var x = 0; x < rows.length; x++){
        $(`#${uploadId}-individual-table-image-row-${x}`).ddslick('select', {index: selectedIndex });
      }
      //handleMainImageOptionChange(upload, uploadId, upload.files.images[selectedData.selectedIndex].name, selectedData.selectedIndex);
    }   
  });
  
  //create padding selection col header and add it to table
  let paddingSelect = await createPaddingSelect(`${uploadId}-individual-table-padding-col`, true, 'max-width: 100px;')
  document.getElementById(`${uploadId}-individual-table-padding-col`).innerHTML = paddingSelect;
  //create resolution selection col header and add it to table
  let resolutionSelect = await createResolutionSelectIndividualCol(`${uploadId}-individual-table-resolution-col`, true, 'max-width: 50px;', 4)
  document.getElementById(`${uploadId}-individual-table-resolution-col`).innerHTML = resolutionSelect;
  //create output video format selection col header and add it to table
  let outputVid = await createOutputVidSelectIndividualCol(`${uploadId}-individual-table-output-vid-col`, true, 'max-width: 100px;', 4)
  document.getElementById(`${uploadId}-individual-table-output-vid-col`).innerHTML = outputVid;
  
  //draw table
  table.draw();

  //update css color
  updatePaddingSelectCss(`${uploadId}-individual-table-padding-col`)

  //get img resolutions info
  let uploadImageResolutions = await getResolutionOptions(upload.files.images);

  //if image selection col header changes, update each row
  $(`#${uploadId}-individual-table-image-col`).on('change', async function () {
    //get new image choice
    let indexValueImgChoice = document.querySelector(`#${uploadId}-individual-table-image-col select`).value
    //get img name
    let newImgPath = upload.files.images[indexValueImgChoice].path
    console.log(`update selected image for ${table.rows().eq(0).length} rows`)
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
        createResolutionSelect(uploadImageResolutions, newImgPath, `${uploadId}-individual-table-resolution-row-${index}`);
      }

    });
  });

  //if padding selection col header changes, update each row
  $(`#${uploadId}-individual-table-padding-col`).on('change', async function () {
    //get new padding choice
    let newPaddingChoice = document.querySelector(`#${uploadId}-individual-table-padding-col select`).value
    //update col header padding display css
    updatePaddingSelectCss(`${uploadId}-individual-table-padding-col`)
    //set all rows in table to have new padding value
    var table = $(`#${uploadId}-individual-table`).DataTable()
    var rows = table.rows().data()
    //set all values 
    for(var x = 0; x < rows.length; x++){
      //get selected image for this row
      var  rowImgIndex = $(`#${uploadId}-individual-table-image-row-${x}`).find('input[type=hidden]:first').val()
      console.log('rowImgIndex=',rowImgIndex)
      let rowImgPath = upload.files.images[rowImgIndex].path
      //update that rows selected padding
      document.getElementById(`${uploadId}-individual-table-padding-row-${x}`).value = `${newPaddingChoice}`
      //if padding is not 'none', generate dropdown with static resolutions
      if (!newPaddingChoice.toLowerCase().trim().includes('none')) {
        createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${x}`);
      } else {
        createResolutionSelect(uploadImageResolutions, rowImgPath, `${uploadId}-individual-table-resolution-row-${x}`);
      }
      
      //update padding display css for row
      updatePaddingSelectCss(`${uploadId}-individual-table-padding-row-${x}`)
      //fire off change event for that row
      $(`#${uploadId}-individual-table-padding-row-${x}`).change();
    }

  });

  //if resolution selection col header changes, update each row
  $(`#${uploadId}-individual-table-resolution-col select`).on('change', async function () {
    //get new resolution choice
    let indexValueResolutionChoice = document.querySelector(`#${uploadId}-individual-table-resolution-col select`).value - 1;
    console.log('indexValueResolutionChoice = ', indexValueResolutionChoice)
    //set all rows in table to have new resolution value
    table.rows().eq(0).each(function (index) {
      document.getElementById(`${uploadId}-individual-table-resolution-row-${index}`).selectedIndex = `${indexValueResolutionChoice}`
    });
  });

  //if output video format selection col header changes, update each row
  $(`#${uploadId}-individual-table-output-vid-col`).on('change', async function () {
    //get new video format choice
    let outputVidChoice = document.querySelector(`#${uploadId}-individual-table-output-vid-col select`).value;
    //set all table rows to have new vid value
    table.rows().eq(0).each(function (index) {
      console.log('change for ', `${uploadId}-individual-table-output-vid-row-${index}`)
      let indexOutputVidChoice = 0;
      if(outputVidChoice.toLowerCase().trim() == 'mp4'){
        indexOutputVidChoice=1
      }else if(outputVidChoice.toLowerCase().trim() == 'mkv'){
        indexOutputVidChoice=0
      }

      document.getElementById(`${uploadId}-individual-table-output-vid-row-${index}`).selectedIndex = `${indexOutputVidChoice}`
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
  console.log('updateSelectedDisplays() begin')
  var fullAlbumLength = ''
  var fullAlbumTracklist = ''
  
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
  
  var startTime = 0
  var endTime = 0;
  //for each selected row
  for (var i = 0; i < selectedRowsCount; i++) {
    //get data for individualRenderTable
    var row = selectedRows[i];    
    //create imgSelect
    let rowImgSelect = await createImgSelectPreview(upload.files.images, `${uploadId}-individual-table-image-row-${i}`, 'individRowImg')
    //create paddingSelect
    let rowPaddingSelect = await createPaddingSelect(`${uploadId}-individual-table-padding-row-${i}`, false, 'max-width:100px', 'rowPadding')
    //create output vid select
    let rowOutputVidSelect = `
    <form class="form-inline">
      <div class="form-group">
          <select id='${uploadId}-individual-table-output-vid-row-${i}' class="form-control rowOutputVid" style="max-width:100px"> 
            <option value="mkv">mkv</option>
            <option value="mp4">mp4</option>
          </select> 
      </div>
    </form>`;
    
    
    //add row to individualRenders table
    individualRendersTable.row.add({
      "audio": row.audio,
      "audioFilepath": row.audioFilepath,
      "length": row.length,
      "imgSelection": rowImgSelect,
      "padding": rowPaddingSelect,
      "resolution": `<select id='${uploadId}-individual-table-resolution-row-${i}' class="form-control rowRes"></select>`,
      "outputVid": rowOutputVidSelect
    })
    //draw individual renders table
    individualRendersTable.draw();

    
    //add jQuery setup to display images inside <select> <option> elements for main image selection
    
    //replace this with msdropdown?
    //$(`#${uploadId}-individual-table-image-row-${i}`).ddslick({
   //   width:'flex',
    //  background: '#FFFFFF',
    //});
    

    //create html options of resolutions based off the default selected image name, and add to ${uploadId}-resolutionSelect
    createResolutionSelect(uploadImageResolutions, upload.files.images[0].path, `${uploadId}-individual-table-resolution-row-${i}`);
    // -----------------------------------------
    //generate tracklist and length display text
    // -----------------------------------------
    //get track time and round 
    var currTrackTimeSeconds = await ipcRenderer.invoke('get-audio-length', selectedRows[i].audioFilepath);
    currTrackTimeSeconds=Math.round(currTrackTimeSeconds)
    //calcualte running times
    if(endTime == 0){
      startTime=0
      endTime = currTrackTimeSeconds
    }else{
      startTime = endTime
      endTime = startTime + currTrackTimeSeconds
    }
    //console.log(`selectedRows[${i}] startTime=${startTime}, endTime=${endTime}`)
    //convert times to hh:mm:ss
    var startTimeDisplay = new Date(startTime * 1000).toISOString().slice(11, 19);
    var endTimeDisplay = new Date(endTime * 1000).toISOString().slice(11, 19);

    //update tracklist
    fullAlbumTracklist = `${fullAlbumTracklist}${selectedRows[i].audio} ${startTimeDisplay}-${endTimeDisplay}<br>`
    //console.log(`fullAlbumTracklist=${fullAlbumTracklist} \n`)
    
    
    //update css padding color display
    updatePaddingSelectCss(`${uploadId}-individual-table-padding-row-${i}`)
    /*
    */
  
  }

  
  //if selected padding option for row changes, update resolution for that row
  $(`.rowPadding`).on('change', async function () {
    console.log('rowPadding changed')
    //get row info
    let rowId = $(this)[0].id
    let rowNum = (rowId).substr((rowId).lastIndexOf('-') + 1)
    //update row display color
    updatePaddingSelectCss(`${uploadId}-individual-table-padding-row-${rowNum}`)
    //get image info
    let newImageNum = $(`#${uploadId}-individual-table-image-row-${rowNum}`).find('input[type=hidden]:first').val()
    let newImagePath = upload.files.images[newImageNum].path;
    //get padding info
    let paddingChoice = $(`#${uploadId}-individual-table-padding-row-${rowNum}`).val();
    //if padding is not 'none', generate dropdown with static resolutions
    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    } else {
      createResolutionSelect(uploadImageResolutions, newImagePath, `${uploadId}-individual-table-resolution-row-${rowNum}`);
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
    let newImagePath = upload.files.images[newImageNum].path;
    //console.log('newImageName:', newImageName)
    //get padding info
    let paddingChoice = $(`#${uploadId}-individual-table-padding-row-${rowNum}`).val()
    //console.log('paddingChoice:', paddingChoice)

    //if padding is not 'none', generate dropdown with static resolutions
    if (!paddingChoice.includes('none')) {
      createResolutionSelect(null, null, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    } else {
      createResolutionSelect(uploadImageResolutions, newImagePath, `${uploadId}-individual-table-resolution-row-${rowNum}`);
    }

    console.log('updateSelectedDisplays() end')
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
        returnVar[images[x].path] = temp;
      }
      resolve(returnVar)
    } catch (err) {
      console.log('getResolutionOptions() err = ', err)
    }
  });
}

//generate resolution dropdown html
function createResolutionSelect(uploadImageResolutions, imageName, selectId) {
  console.log(`createResolutionSelect()`)
  //clear options 
  try{
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
  }catch(err){
    console.log('createResolutionSelect() err: ',err )
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
                <select id='${selectId}' 
                class="form-control ${selectClass}" 
                style="${selectStyle}"
                onChange="
                  (this.value!='custom'&&this.value!='Custom'&&this.value!='white'&&this.value!='White'&&this.value!='none'&&this.value!='None')?(this.style.backgroundColor=this.value):(this.style.backgroundColor='white');
              
                  this.style.backgroundColor=this.value;
                "
                
                > 
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

//create output video selection div
async function createOutputVidSelectIndividualCol(selectId, includeLabel, selectStyle = "") {
  return new Promise(async function (resolve, reject) {
    //include label if we want to 
    let label = "";
    if (includeLabel) {
      label = "<label>Output Vid:⠀</label>"
    }

    //create selection form
    var selectForm = `
          <form class="form-inline">
            <div class="form-group">
                ${label}
                <select id='${selectId}' class="form-control" style="${selectStyle}"> 
                  <option value="mkv">mkv</option>
                  <option value="mp4">mp4</option>
                </select> 
            </div>
          </form>`;

    //return html
    console.log('createOutputVidSelectIndividualCol(): ', selectForm)
    resolve(selectForm)
  })
}
//create html element and assign event listener to always display chosen image hex color values (vibrant.js)
async function createPaddingImgColors(images, uploadId, paddingImgColorsId){
  return new Promise(async function (resolve, reject) {
    try{
      //get current image from upload object
      let selectedImgIndex = await getSelectedImageIndex(uploadId) 
      //get current image
      let uploads = await JSON.parse(localStorage.getItem('uploadList'))
      let selectedImage = uploads[uploadId].files.images[selectedImgIndex]
      //get current image colors
      let currentImageColors = await getImageColors(selectedImage.path);
      //create small box for each color
      let colorBoxesHTML = '';
    
      for(var x = 0; x < currentImageColors.length; x++){
        colorBoxesHTML=`${colorBoxesHTML} 
        <div 
          id="${uploadId}-color-${x}" 
          title="${currentImageColors[x]}" 
          class="colorBox " 
          onClick="colorBoxClicked(this, '${uploadId}')"
          style="background: ${currentImageColors[x]}"
        ></div>`
      }

      //create html
      let colorPaddingHTML = `
        <div id='${paddingImgColorsId}'>
          ${colorBoxesHTML}
        </div>`;
      //add event listener that calls fucntion when img changes
      //reset defautl selected
      resolve([colorPaddingHTML, currentImageColors])
    }catch(err){
      reject(err)
    }
  })
}

//create select html element for each image with img previews
async function createImgSelectPreview(images, selectId, extraClass='') {
  return new Promise(async function (resolve, reject) {
    
    //create each individual <option> element
    var imgSelectOptions = ``;
  
    for(var x = 0; x < images.length; x++){
      var imageFilename = `${images[x].name}`;
      var imageFilepath = `${images[x].path}`
      var imageSize = `${images[x].size}`
      var imageResolution = `${images[x].resolution}`

      imgSelectOptions = imgSelectOptions + `<option 
        value="${x}"
        id='tempOptionIdVal'
        data-imagesrc="${imageFilepath}" 
        data-description="${imageSize}, ${imageResolution}"
        height="100px"
        style='background:white!important;'
        >
        ${imageFilename}
        </option>`
    }

    //create the full <select> element
    var imgSelectElem = `
      <select 
        class='extraClass ${extraClass}'
        id='${selectId}'
      >
      ${imgSelectOptions}
    </select>
    `;

    resolve(imgSelectElem)
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
    //create dataset
    let dataSet = []
    let fileCount = 1;
    try {
      //sort audio files by title
      try{
        uploadFiles['audio'].sort((a, b) => a.name.match(/\d+/)[0] - b.name.match(/\d+/)[0]);
      }catch(err){

      }
      //for each audio file
      for (var x = 0; x < uploadFiles['audio'].length; x++) {
        var audioObj = uploadFiles['audio'][x]

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
