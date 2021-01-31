const { Console } = require('console');
const { resolve } = require('path');
const { ipcRenderer } = window.require('electron');

//require datatables
require('datatables.net-dt')();
require('datatables.net-rowreorder-dt')();

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
  //if there is no upload in the sidebar with the 'selected tag' 
  var noUploadSelected = !document.querySelector(".sidebar-selected");
  console.log('noUploadSelected = ', noUploadSelected)
  if (noUploadSelected) {
    //toggle home icon as on if it is off
    console.log('status = ', $("#homeButton").hasClass("page-selected"))
    //$("#homeButton").toggleClass("page-selected");
    console.log('status = ', $("#homeButton").hasClass("page-selected"))
  }
  //if uploads-list is already open
  if ($("#menu-toggle").hasClass("svg-selected")) {

    //go back to home
    //$("#homeButton").toggleClass("page-selected");
    //$("#new-upload-html").hide();
    //$("#default-home-html").show();
    //$("#upload-selection-html").hide();

    //else if uploads-list is not currently open when we click it
  } else {

    //$("#new-upload-html").hide();
    //$("#default-home-html").hide();
    //$("#upload-pages-container").show();
    //if 'selected' is on for homeButton, toggle it off
    /*
    if ($("#homeButton").hasClass('page-selected')) {
      $("#homeButton").toggleClass("page-selected");
    }
    */
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
async function init() {
  //ensure uploadList exists
  var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
  if (!uploadList) {
    console.log('localstorage uploadList not exist', uploadList)
    setLocalStorage('uploadList', {})
  } else {
    //console.log('localstorage uploadList do exist: ', uploadList)
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

//if enter key is pressed and newUpload modal is open; click 'create'
$(document).keypress(function (e) {
  if (e.which == 13) {
    var isModalShown = ($("#new-upload-modal").data('bs.modal') || {})._isShown;
    console.log('enter clicked, isModalShown = ', isModalShown)
    if(isModalShown){
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
  console.log('addNewUpload() uploadTitle=', uploadTitle, '. fileList=', fileList)
  //if fileList exists:
  if(fileList){
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

//upload where we display all the uploads
async function updateUploadListDisplay() {
  return new Promise(async function (resolve, reject) {
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
        //get image from files
        let imgPath = uploadFiles.images[0].path;
        uploadNumber = key.split('-')[1];

        //update sidebar display
        $("#sidebar-uploads").prepend(`
              <li>

                  
                  <a href="#" id='${uploadId}-sidebar' onClick='displayUpload("${uploadId}")'><img src="${imgPath}" class='sidebarUploadImg'> ${uploadTitle}</a>
              </li>
            `);

      }
    }
    resolve()
  })
}

//display an upload to the user
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
  console.log('display this upload: ', upload)
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

async function createUploadPage(upload, uploadId) {
  //create image gallery container
  let images = [];
  for (var z = 0; z < upload.files.images.length; z++) {
    let img = upload.files.images[z]
    images.push(`<img src="${img.path}" data-caption="${img.name}">`)
  }
  console.log('createUploadPage upload = ', upload)
  //add html to page
  $("#upload-pages-container").append(`
    <div class="col-lg-12 upload">
      <h1>${upload.title}</h1>

      <!-- files table -->
      <div class='scroll'>
      
        
        <table id="${uploadId}_table" class="table table-sm table-bordered scroll display filesTable" cellspacing="2" width="100%">
            <thead> 
                <tr>
                    <th>sequence</th>
                    <th style='min-width: 25px;'>#</th>
                    <th style="min-width: 20px;"><input id='${uploadId}_table-selectAll' type="checkbox"></th>
                    <th class='left-align-col' >Audio</th>
                    <th class='left-align-col' style='max-width:58px'>Length</th>
                    <!-- 
                    <th style='width:150px'>
                        Video Format: 
                        <div>
                            <select id='${uploadId}_table-vidFormat-col'>
                                <option value="0">mp4</option>
                                <option value="1">avi</option>
                            </select> 
                        </div>
                    </th> -->
                    <th>audioFilepath</th>
                    <th class='left-align-col' style='width:83px'>Track Num</th>
                    <th class='left-align-col' style='width:300px'>
                        <div id='${uploadId}_table-image-col'>
                            <label>Img:</label>
                        </div>
                    </th>

                    <!--
                    <th>Video Output Folder: 
                        <div >
                            <button id='${uploadId}_table-vidLocationButton'>Select</button>
                            <input style='display:none' id='${uploadId}_table-vidLocation' type="file" webkitdirectory />
                        </div>
                    </th>
                    -->
                </tr>
            </thead>
        </table>

      </div>

   
    </div>
    `);
  //create datatable (dataset, event listeners, etc)
  createDatatable(upload, uploadId)
}

async function createDatatable(upload, uploadId) {
  //create dataset
  let data = await createDataset(upload.files, uploadId)

  //setup table
  var reorder = false;
  var searched = false;
  var origIndexes = [];
  var origSeq = [];
  var origNim = [];

  let tableId = `#${uploadId}_table`;
  //create table
  var table = $(tableId).DataTable({
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
      //{ "data": "format" },
      { "data": "length" },
      //{ "data": "outputFormat" },
      { "data": "audioFilepath" },
      { "data": "trackNum" },
      { "data": "imgSelection" },
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
        type: "natural"
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
      },
      { //image selection
        targets: 7,
        type: "string",
        orderable: false,
        className: 'text-left'
      },
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
      //"format": 'adasd',//i.format,
      "length": i.length,
      //"outputFormat": i.vidFormatSelection,
      //"outputLocation": "temp output location",
      "audioFilepath": i.audioFilepath,
      "trackNum": i.trackNum,
      "imgSelection": i.imgSelection,
    }).node().id = 'rowBrowseId' + i.sampleItemId;
    count++;
  });
  //draw table
  table.draw();


  //create image dropdown selection column header

  /////////
  //create img selection part of <select> form for each image
  var imageSelectionOptions = ``
  for (var x = 0; x < upload.files.images.length; x++) {
    var imageFilename = `${upload.files.images[x].name}`
    imageSelectionOptions = imageSelectionOptions + `<option value="${x}">${imageFilename}</option>`
  }
  //create img selection form
  var imgSelectionSelect = `
    <form class="form-inline">
      <div class="form-group">
        <label>Img:⠀</label>
          <select id='${uploadId}-imageOptionsCol' class="form-control" style="height:40px;">`;
  imgSelectionSelect = `${imgSelectionSelect} ${imageSelectionOptions} </select> 
      </div>
    </form>`

  //add image dropdown selection to table html
  document.getElementById(`${uploadId}_table-image-col`).innerHTML = imgSelectionSelect;

  ////////////////////////////////
  //if image selection col header is changed
  $(`#${uploadId}-imageOptionsCol`).change(function (event) {
    let indexValueImgChoice = $(`#${uploadId}-imageOptionsCol`).val()
    table.rows().eq(0).each(function (index) {
      document.getElementById(`${uploadId}_table-audio-${index}-img_choice`).selectedIndex = `${indexValueImgChoice}`
    });
  });

  //if select all checkbox clicked
  $(`#${uploadId}_table-selectAll`).on('click', function (event) {
    let checkedStatus = document.getElementById(`${uploadId}_table-selectAll`).checked
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

    //updateFullAlbumDisplayInfo(table, uploadNumber)

  });

  //if a row is clicked
  $(`#${uploadId}_table tbody`).on('click', 'tr', function () {
    //determine whether or not to select/deselect & check/uncheck row
    var isSelected = $(this).hasClass('selected')
    $(this).toggleClass('selected').find(':checkbox').prop('checked', !isSelected);
  });

  //if table order changes
  table.on('order.dt', function (e, diff, edit) {

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

  });
  table.on('row-reorder', function (e, details, edit) {
    //get original row indexes and original sequence (rowReorder indexes)
    origIndexes = table.rows().indexes().toArray();
    origSeq = table.rows().data().pluck('sequence').toArray();
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
  });

  //row-reorder
  table.on('row-reorder', function (e, diff, edit) {
    var result = 'Reorder started on row: ' + edit.triggerRow.data()[1] + '<br>';

    for (var i = 0, ien = diff.length; i < ien; i++) {
      var rowData = table.row(diff[i].node).data();

      result += rowData[1] + ' updated to be in position ' +
        diff[i].newData + ' (was ' + diff[i].oldData + ')<br>';
    }

    //console.log(result);
  });

  /////////////////////////////////
}

//create dataset for the table in an upload
async function createDataset(uploadFiles, uploadId) {
  return new Promise(async function (resolve, reject) {
    //create img selection part of form
    var imageSelectionOptions = ``
    try {
      //for each image
      for (var x = 0; x < uploadFiles.images.length; x++) {
        var imagFilename = `${uploadFiles.images[x].name}`
        imageSelectionOptions = imageSelectionOptions + `<option value="${x}">${imagFilename}</option>`
      }
    } catch (err) {

    }

    //create dataset
    let dataSet = []
    let fileCount = 1;
    try {
      //for each audio file
      for (var x = 0; x < uploadFiles['audio'].length; x++) {
        var audioObj = uploadFiles['audio'][x]

        //create img selection form
        var imgSelectionSelect = `
        <form class="form-inline">
          <div class="form-group">
            <label>Img:⠀</label>
              <select id='${uploadId}_table-audio-${x}-img_choice' class="form-control" style="height:40px;">`;

        imgSelectionSelect = `${imgSelectionSelect} ${imageSelectionOptions} </select> 
        </div>
      </form>`

        //create vid output selection
        var videoOutputSelection = `
              <select id='${uploadId}_table-vidFormat-row_${x}'>
                  <option value="0">mp4</option>
                  <option value="1">avi</option>
              </select> 
              `

        //create row obj
        let rowObj = {
          //sequence(leave empty)
          itemId: fileCount,
          //select box(leave empty)
          audio: audioObj.name,
          format: audioObj.type,
          length: audioObj.length,
          imgSelection: imgSelectionSelect,
          vidFormatSelection: videoOutputSelection,
          audioFilepath: audioObj.path,
          trackNum: audioObj.trackNum
          //video output(leave empty)
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

