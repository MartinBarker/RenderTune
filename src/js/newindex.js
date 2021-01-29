const { Console } = require('console');
const { ipcRenderer } = window.require('electron');

// recieve app version and send it to html 
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
  ipcRenderer.removeAllListeners('app_version');
  const version = document.getElementById('version');
  version.innerText = 'v' + arg.version;
});

//when you click the home button
$("#homeButton").click(function (e) {

  if ($("#homeButton").hasClass("page-selected")) {

  } else {
    console.log('toggle home button on')
    $("#homeButton").toggleClass("page-selected");
    //we are toggling the button on 
    $("#new-upload-html").hide();
    $("#upload-selection-html").hide();
    $("#default-home-html").show();
    //untoggle newUploadButton button if needed 
    if ($("#newUploadButton").hasClass('page-selected')) {
      $("#newUploadButton").toggleClass("page-selected");
    }
    //untoggle UploadsList button if needed 
    if ($("#menu-toggle").hasClass('svg-selected')) {
      $("#menu-toggle").toggleClass("svg-selected");
      $("#wrapper").toggleClass("toggled");
    }
  }

});

//when you click the NewUpload button
$("#newUploadButton").click(function (e) {

  if ($("#newUploadButton").hasClass("page-selected")) {

  } else {

    console.log('toggle new upload button on')
    $("#newUploadButton").toggleClass("page-selected");
    //change which body html to display
    //$("#new-upload-html").show();
    //$("#default-home-html").hide();
    //$("#upload-selection-html").hide();

    //untoggle home button if needed
    /*
    if ($("#homeButton").hasClass('page-selected')) {
      $("#homeButton").toggleClass("page-selected");
    }
    */
    
    /*
    //untoggle UploadsList button if needed 
    if ($("#menu-toggle").hasClass('svg-selected')) {
      $("#menu-toggle").toggleClass("svg-selected");
      $("#wrapper").toggleClass("toggled");
    }
    */
  }
});

//when you click the Uploads list button
$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");

  //if uploads-list is already open
  if ($("#menu-toggle").hasClass("svg-selected")) {

    //go back to home
    $("#homeButton").toggleClass("page-selected");
    $("#new-upload-html").hide();
    $("#default-home-html").show();
    $("#upload-selection-html").hide();
  
  //else if uploads-list is not currently open when we click it
  } else {
    
    $("#new-upload-html").hide();
    $("#default-home-html").hide();
    $("#upload-selection-html").show();
    //if 'selected' is on for homeButton, toggle it off
    if ($("#homeButton").hasClass('page-selected')) {
      $("#homeButton").toggleClass("page-selected");
    }
    //if 'selected' is on for newUploadButton, toggle it off
    if ($("#newUploadButton").hasClass('page-selected')) {
      $("#newUploadButton").toggleClass("page-selected");
    }
  }

  $("#menu-toggle").toggleClass("svg-selected");
});

//if newUpload modal is closed:
$('#new-upload-modal').on('hide.bs.modal', function () {
  console.log("'#new-upload-modal').on('hidden.bs.modal',")
    if ($("#newUploadButton").hasClass("page-selected")) {
      console.log('toggle new upload button on')
      $("#newUploadButton").toggleClass("page-selected");
    }     
})

//when document window is ready call init function
$(document).ready(function () {
  //call init function
  init();
});

//init: get uploadList and display it
async function init(){
  //ensure uploadList exists
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  if(!uploadList){
    console.log('localstorage uploadList not exist', uploadList)
    setLocalStorage('uploadList', {})
  }else{
    //console.log('localstorage uploadList do exist: ', uploadList)
  }
  //display uploads
  updateUploadListDisplay();
}

//update localstorage
async function setLocalStorage(itemName, itemValue){
  let result = await localStorage.setItem(itemName, JSON.stringify(itemValue))
}

async function deleteAllUploads() {
  await localStorage.setItem('uploadList', JSON.stringify({}))
  updateUploadListDisplay();
}

/*
    NEW UPLOAD MODAL EVENT HANDLING:
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
  document.getElementById('newUploadImageFileList').innerHTML = ''
  document.getElementById('newUploadAudioFileList').innerHTML = ''
  haveNewFilesBeenAdded = false;
  newUploadFiles = {}
  fileList = null;
  $(this)
      .find("input,textarea,select")
      .val('')
      .end()
      .find("input[type=checkbox], input[type=radio]")
      .prop("checked", "")
      .end();
})

//when new upload modal is shown, click input field
$('#new-upload-modal').on('shown.bs.modal', function (e) {
  //if enter key is pressed, click confirm
  $(document).keypress(function (e) {
      if (e.which == 13) {
          document.getElementById('createUploadButton').click()
      }
  })
  //make input field focused
  $('input:text:visible:first', this).focus();
})

//when files are added to popup modal either by drag&drop or file selection
let fileList = null;
async function newUploadFileDropEvent(event, preventDefault) {
    let haveNewFilesBeenAdded = false;
    //reveal loading spinner
    document.getElementById('loadingFilesSpinner').style.display = "block";

    if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
    }

    //create fileList if it doesn't exist
    if (!fileList) {
        fileList = { 'images': [], 'audio': [] }
    }
    console.log('event.dataTransfer.files = ', event.dataTransfer.files)
    //sort all files into audio / images 
    for (const f of event.dataTransfer.files) {
        // Using the path attribute to get absolute file path 
        if ((f.type).includes('image')) {
            //if image filepath does not already exist in newUploadTempFiles:
            if (fileList.images.filter(e => e.path === `${f.path}`).length == 0) {
                fileList.images.push({ 'path': f.path, 'type': f.type, 'name': f.name })
                console.log('pushing image')
                haveNewFilesBeenAdded = true;
            }

        } else if ((f.type).includes('audio')) {
            let audioFileInfo = {};
            //get audio file format
            var splitType = (f.type).split('/')
            var audioFormat = splitType[1]
            audioFileInfo.format = audioFormat;

            const metadata = await getMetadata(f.path);
            audioFileInfo.trackNum = metadata.common.track.no;
            audioFileInfo.length = metadata.format.duration ? new Date(metadata.format.duration * 1000).toISOString().substr(11, 8) : 0;

            //push results if that file isnt alread inside .audio
            if (fileList.audio.filter(e => e.path === `${f.path}`).length == 0) {
                fileList.audio.push({ 'path': f.path, 'type': audioFormat, 'name': f.name, 'length': audioFileInfo.length, 'trackNum': audioFileInfo.trackNum })
                console.log('pushing audio')
                haveNewFilesBeenAdded = true;
            }
        }
    }
  
    console.log('newUploadFileDropEvent() fileList = ', fileList, '. haveNewFilesBeenAdded = ', haveNewFilesBeenAdded)

    //if new files have been added, update UI
    if (haveNewFilesBeenAdded) {
        var imageFilesHtml = ''
        var audioFilesHtml = ''
        for (const [key, value] of Object.entries(fileList)) {
            //console.log('DISPLAY IN UI: key = ', key, ', value = ', value)
            if (key == 'images') {
                for (var i = 0; i < value.length; i++) {
                    imageFilesHtml = imageFilesHtml + `${value[i]['name']} <br>`
                }

            } else if (key == 'audio') {
                //for (const [audioFormat, audioFiles] of Object.entries(newUploadFiles['audio'])) {
                for (var x = 0; x < value.length; x++) {
                    //console.log('f = ', audioFiles[x]['name'])
                    audioFilesHtml = audioFilesHtml + `${value[x]['name']} <br>`
                }
                //}
            }
        }

        document.getElementById('newUploadImageFileList').innerHTML = imageFilesHtml
        document.getElementById('newUploadAudioFileList').innerHTML = audioFilesHtml
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

  //if there are no images:
  if (fileList.images.length == 0) {
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

      let uploadKey = `upload-${uploadNumber}`
      let uploadObj = { 'title': uploadTitle, 'files': fileList }
      fileList = null;

      //add to uploadList obj
      await addToUploadList(uploadKey, uploadObj)

      //close modal
      $('#new-upload-modal').modal('toggle');

      //update uploadListDisplay
      updateUploadListDisplay()
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

//upload where we display all the uploads
async function updateUploadListDisplay() {
  //reset
  document.getElementById('sidebar-uploads').innerHTML = "";
  //get uploadList from localstorage
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))

  console.log('~ updateUploadListDisplay() uploadList = ', uploadList)

  //if uploadList exists
  if (uploadList != null) {
      //update numberOfUploads display
      document.getElementById('numberOfUploads').innerText = Object.keys(uploadList).length;
      //for each object in uploadList
      for (const [key, value] of Object.entries(uploadList)) {
          let uploadId = key
          let uploadTitle = value.title
          let uploadFiles = value.files
          uploadNumber = key.split('-')[1];

          $("#sidebar-uploads").prepend(`
            <li>
                <a href="#">${uploadTitle}</a>
            </li>
          `);
          //var liElement = document.createElement("li");
          //var aElement = document.createElement("a");
          //para.appendChild(node);

          //console.log('~ updateUploadListDisplay() uploadNumber = ', uploadNumber)
          //if div with id = upload-${uploadNumber} does not exist:
          //var uploadObj = uploadList[uploadId];
          //console.log("~ updateUploadListDisplay() uploadObj = ", uploadObj)
          //if (uploadObj == null) {
          //console.log('~ updateUploadListDisplay() add to display: ', key, ', ', value)
          //await createNewUploadCard(uploadTitle, uploadNumber, uploadFiles)
          //console.log('updateUploadListDisplay() newUploadCard = ', newUploadCard)
          //uploadListDisplay.appendChild(newUploadCard);
          //console.log(`    ${key}: ${value}`);
          //uploadListDisplay.innerHTML = uploadListDisplay.innerHTML + `[${key}]-${JSON.stringify(value)}]<br><hr>`
      }
  }

}