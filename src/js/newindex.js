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

//if newUpload modal is closed:
$('#new-upload-modal').on('hide.bs.modal', function () {

  console.log("'#new-upload-modal').on('hidden.bs.modal',")

    if ($("#newUploadButton").hasClass("page-selected")) {
      console.log('toggle new upload button on')
      $("#newUploadButton").toggleClass("page-selected");
    } 
  
      
})

//when you click the Uploads list button
$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");

  if ($("#menu-toggle").hasClass("svg-selected")) {
    console.log('toggle Uploads button off')
    //go back to home
    $("#homeButton").toggleClass("page-selected");
    $("#new-upload-html").hide();
    $("#default-home-html").show();
    $("#upload-selection-html").hide();
  } else {
    console.log('toggle Uploads button on')
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

$(document).ready(function () {

  init();

  $("#wrapper").on('change', 'input', function () {
    console.log(" .change() called.");
  });

  $('#wrapper').on('classChange', function () {
    console.log(" class changed");
  });

  $("#sidebar-toggle").on('hidden.bs.collapse', function () {
    console.log("Handler for .change() called.");
  });


  $("#sidebar-nav").on('hidden.bs.collapse', function () {
    console.log("Handler for .change() called.");
  });

});

async function init(){
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  if(!uploadList){
    console.log('localstorage uploadList not exist', uploadList)
    setLocalStorage('uploadList', {})
  }else{
    console.log('localstorage uploadList do exist: ', uploadList)
  }
}

//cupdate localstorage
async function setLocalStorage(itemName, itemValue){
  let result = await localStorage.setItem(itemName, JSON.stringify(itemValue))
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

/*
    FUNCTION FOR WHEN NEW FILES ARE ADDED TO NEW-UPLOAD-MODAL
    
*/
//when files are dragged into upload drag&drop space
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
  //console.log(`Music-metadata: track-number = ${metadata.common.track.no}, duration = ${metadata.format.duration} sec.`);
  return metadata;
}