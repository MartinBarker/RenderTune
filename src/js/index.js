const { Console } = require('console');

const { ipcRenderer } = window.require('electron');

//let server = require('./app');
var newUploadFiles = {}

//display every upload in uploadList[]
updateUploadListDisplay()

//require('electron-renderer');

//require datatables
require('datatables.net-dt')();
require('datatables.net-rowreorder-dt')();

//if new upload navbar button is clicked
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
$('#uploadModal').on('hidden.bs.modal', function (e) {
    document.getElementById('newUploadImageFileList').innerHTML = ''
    document.getElementById('newUploadAudioFileList').innerHTML = ''
    $(this)
        .find("input,textarea,select")
        .val('')
        .end()
        .find("input[type=checkbox], input[type=radio]")
        .prop("checked", "")
        .end();
})

//when new upload modal is shown, click input field
$('#uploadModal').on('shown.bs.modal', function (e) {
    //if enter key is pressed, click confirm
    $(document).keypress(function (e) {
        if (e.which == 13) {
            document.getElementById('createUploadButton').click()
        }
    })
    //make input field focused
    $('input:text:visible:first', this).focus();
})

//when delete modal is shown, if enter is pressed -> click confirm
$('#deleteModal').on('shown.bs.modal', function (e) {
    //if enter key is pressed, click confirm
    $(document).keypress(function (e) {
        if (e.which == 13) {
            document.getElementById('deleteUploadConfirm').click()
        }
    })
})

//open url in user's default browser
async function openUrl(type) {
    var open = require("open");
    if (type = 'github') {
        open("https://github.com/MartinBarker/audio-archiver/");
    }

}

//new upload
async function addNewUpload(uploadTitle) {
    console.log('addNewUpload() newUploadFiles = ', newUploadFiles)

    //check if there is an image to use:
    if (newUploadFiles.images.length == 0) {
        console.log('length = 0')
        document.getElementById('newUploadAlert').style.display = "block";
    } else {
        document.getElementById('newUploadAlert').style.display = "none";
        console.log('length != 0')
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
        let uploadObj = { 'title': uploadTitle, 'files': newUploadFiles }
        newUploadFiles = {};
        fileList = fileList = { 'images': [], 'audio': [] };

        //add to uploadList obj
        await addToUploadList(uploadKey, uploadObj, uploadNumber)

        //update uploadListDisplay
        updateUploadListDisplay()
    }

}

async function removeUploadFromUploadList(uploadId) {
    //console.log("delete ", uploadId)
    let uploadList = await JSON.parse(localStorage.getItem('uploadList'))
    //console.log("delte(0 before = uploadList = ", uploadList)
    delete uploadList[uploadId]
    //console.log("REM(0 after = ", uploadList)
    await localStorage.setItem('uploadList', JSON.stringify(uploadList))

}

async function deleteUpload(uploadId) {
    //console.log("deleteUpload() uploadId = ", uploadId)
    //when delete button is clicked

    document.getElementById("deleteUploadConfirm").addEventListener('click', confirmDelete, { passive: false });

    async function confirmDelete() {
        //console.log("deleteUpload() DELETE uploadId = ", uploadId)
        //remove card display
        document.getElementById(uploadId).remove()
        //remove card from db
        await removeUploadFromUploadList(uploadId)
        //remove event listener
        document.getElementById("deleteUploadConfirm").removeEventListener('click', confirmDelete);
    }




    //async function confirmDelete() {

    //}

}

async function deleteAllUploads() {
    await localStorage.setItem('uploadList', JSON.stringify({}))
    document.getElementById('uploadList').innerHTML = ''
}

//create dataset for the table in an upload
async function createDataset(uploadFiles, uploadNumber) {
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
                var imgSelectionSelect = `<select style='width:150px' id='upload_${uploadNumber}_table-audio-${x}-img_choice' >`
                imgSelectionSelect = imgSelectionSelect + imageSelectionOptions + `</select>`

                //creaet vid output selection
                var videoOutputSelection = `
                <select id='upload_${uploadNumber}_table-vidFormat-row_${x}'>
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

//set every video-format in table
function setAllVidFormats(uploadNum, rowNum, choice) {

    for (var x = 0; x < rowNum; x++) {
        document.getElementById(`upload_${uploadNum}_table-vidFormat-row_${x}`).selectedIndex = `${choice}`

        //console.log(`document.getElementById('upload_${uploadNum}_table-vidFormat-row_${x}').selectedIndex = ${choice}`)
    }
    //document.getElementById(`upload_1_table-vidFormat-row_2`).selectedIndex = 1

    //document.getElementById(`upload_1_table-vidFormat-row_2`).selectedIndex = 1
}

//create new upload, add datatable and event-listeners
async function createNewUploadCard(uploadTitle, uploadNumber, uploadFiles) {
    console.log('createNewUploadCard() uploadTitle = ', uploadTitle, ', uploadNumber= ', uploadNumber, ', uploadFiles = ', uploadFiles)
    return new Promise(async function (resolve, reject) {


        $("#uploadList").prepend(`
            
            <div id="upload-${uploadNumber}" class="card uploadCard ">
                <!-- Header -->
                <div class="card-header expandable">
                    <a data-toggle="collapse" href="#collapse-example-${uploadNumber}" aria-expanded="false" aria-controls="collapse-example-${uploadNumber}" class=' ' id="heading-example-${uploadNumber}" >
                        <i class="rotate fa fa-chevron-down " ></i>
                        ${uploadTitle}
                    </a>

                    <a style='cursor: pointer;'  data-toggle="modal" data-target="#deleteModal" onClick='deleteUpload("upload-${uploadNumber}")' > 
                        <i style='color:red' class="fa fa-close pull-right"></i>
                    </a>
                </div>


                <!-- Body -->
                <div id="collapse-example-${uploadNumber}" class="collapse show" aria-labelledby="heading-example-${uploadNumber}">
                    <div class="card-body">
                        
                        <!-- files table -->
                        <table id="upload_${uploadNumber}_table" class="display filesTable" cellspacing="2" width="100%">
                            <thead> 
                                <tr>
                                    <th>sequence</th>
                                    <th style='width:5%;max-width:10px'>#</th>
                                    <th><input id='upload_${uploadNumber}_table-selectAll' type="checkbox"></th>
                                    <th>Audio</th>
                                    <th style='max-width:58px'>Length</th>
                                    <!-- <th style='max-width:200px'>
                                        <div>
                                            <label>Img:</label>
                                            <div id='upload_${uploadNumber}_table-image-col'></div>
                                        </div>
                                    </th>
                                    <th style='width:150px'>
                                        Video Format: 
                                        <div>
                                            <select id='upload_${uploadNumber}_table-vidFormat-col'>
                                                <option value="0">mp4</option>
                                                <option value="1">avi</option>
                                            </select> 
                                        </div>
                                    </th> -->
                                    <th>audioFilepath</th>
                                    <th>Track Num</th>
                                    <!--
                                    <th>Video Output Folder: 
                                        <div >
                                            <button id='upload_${uploadNumber}_table-vidLocationButton'>Select</button>
                                            <input style='display:none' id='upload_${uploadNumber}_table-vidLocation' type="file" webkitdirectory />
                                        </div>
                                    </th>
                                    -->
                                </tr>
                            </thead>
                        </table>

                        <!-- image options -->
                            <div>Image: <div style="display:inline;" id='upload_${uploadNumber}_fullAlbumImgChoiceDiv'></div> 
                            

                        <!-- padding option -->
                        <div>Padding: 
                            <select id='upload_${uploadNumber}_fullAlbumPaddingChoices'>
                                <option value="none">None</option>
                                <option value="white">White</option>
                                <option value="black">Black</option>
                            </select>
                        </div>

                        <!-- resolution options -->
                        <div>Resolution: <div style="display:inline;" id='upload_${uploadNumber}_fullAlbumResolutionChoiceDiv'></div> </div>


                        <!-- Render Individual Button -->
                        <div class="card ml-5 mr-5 mt-1 renderOption" type='button' onclick="renderIndividual(${uploadNumber})">
                            <div class='card-body'>
                                <strong><a style='float:right' id='upload_${uploadNumber}_IndividualRenderStatus'></a></strong>
                                <i class="uploadIndividual fa fa-plus-circle" aria-hidden="true"></i>Render <a id='upload_${uploadNumber}_numChecked'>0</a> individual files
                            </div>
                        </div>

                        <!-- Render Full Album Button -->
                        <div class="card ml-5 mr-5 mt-1 " >
                            <button id='upload_${uploadNumber}_fullAlbumButton'>Render Full Album Video</button>

                            <!-- float right render status -->
                            <strong><a style='float:right' id='upload_${uploadNumber}_fullAlbumStatus'></a></strong>

                            

                            <!-- length -->
                            <div>Length: <a id='upload_${uploadNumber}_fullAlbumLength'>00:00</a></div>

                            <!-- number of tracks -->
                            <div>Num Tracks: <a id='upload_${uploadNumber}_numCheckedFullAlbum'>0</a></div>

                            <!-- tracklist -->
                            Tracklist:
                            <div id='upload_${uploadNumber}_fullAlbumTracklist'></div>

                        </div>

                    </div>
                </div>
            </div>
            
        ` );

        //create image dropdown selection column header
        var uploadImageSelectionColHeader = document.createElement('select')
        uploadImageSelectionColHeader.setAttribute('id', `upload-${uploadNumber}-imageOptionsCol`)
        uploadImageSelectionColHeader.setAttribute('style', `max-width:150px; text-align: left;`)

        try {
            for (var x = 0; x < uploadFiles.images.length; x++) {
                var rowImg = document.createElement('option')
                rowImg.setAttribute('value', x)
                rowImg.setAttribute('style', `width:150px; text-align: left;`)
                rowImg.innerHTML = `${uploadFiles.images[x].name}`
                uploadImageSelectionColHeader.appendChild(rowImg)
            }
        } catch (err) {

        }
        //add image dropdown selection to table html
        //document.getElementById(`upload_${uploadNumber}_table-image-col`).appendChild(uploadImageSelectionColHeader)

        //create full album button image selection
        var fullAlbumImageSelectionColHeader = document.createElement('select')
        fullAlbumImageSelectionColHeader.setAttribute('id', `upload_${uploadNumber}_fullAlbumImgChoice`)
        fullAlbumImageSelectionColHeader.setAttribute('style', `max-width:150px; text-align: left;`)

        try {
            for (var x = 0; x < uploadFiles.images.length; x++) {
                var rowImg = document.createElement('option')
                rowImg.setAttribute('value', x)
                rowImg.setAttribute('style', `width:150px; text-align: left;`)
                //img preview
                rowImg.setAttribute("data-class", "avatar")

                rowImg.innerHTML = `${uploadFiles.images[x].name}`
                fullAlbumImageSelectionColHeader.appendChild(rowImg)
            }
        } catch (err) { }
        //add full album button img selection to upload_${uploadNumber}_fullAlbumImgChoiceDiv
        document.getElementById(`upload_${uploadNumber}_fullAlbumImgChoiceDiv`).appendChild(fullAlbumImageSelectionColHeader)

        //prevent clicking full album img option from clicking full album button
        //document.getElementById(`upload_${uploadNumber}_fullAlbumImgChoice`).addEventListener("click", function (event) {
        //    event.preventDefault()
        //});

        function generateResolutionOptions(uploadImageResolutions, imageName) {
            
            if (uploadImageResolutions == null && imageName == null) {
                console.log('both null')
                uploadImageResolutions = { 'staticResolutions': { resolutions: ['640x480', '1280x720', '1920x1080', '2560x1440', '2560x1600'] } }
                imageName = 'staticResolutions';
            }
            var fullAlbumResolutionSelectionColHeader = document.createElement('select')
            fullAlbumResolutionSelectionColHeader.setAttribute('id', `upload_${uploadNumber}_fullAlbumResolutionChoice`)
            fullAlbumResolutionSelectionColHeader.setAttribute('style', `max-width:150px; text-align: left;`);
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
                resOption.innerHTML = displayText//'<div style="color:red">bungis</div>'//displayText
                fullAlbumResolutionSelectionColHeader.appendChild(resOption)
                //select 1920 hd result by default
                if (width >= 1920 && !minAlreadySelected) {
                    minAlreadySelected = true;
                    resOption.setAttribute('selected', 'selected');
                }
            }
            return fullAlbumResolutionSelectionColHeader;
        };
        function removeAllChildNodes(parent) {
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        }

        //generate resolutions for each image
        let uploadImageResolutions = await getResolutionOptions(uploadFiles.images);
        console.log('uploadImageResolutions = ', uploadImageResolutions)
        //create div of resolutions based off the default selected image name
        let resOptions = generateResolutionOptions(uploadImageResolutions, uploadFiles.images[0].name);
        //add full album resolution selection to upload_${uploadNumber}_fullAlbumResolutionChoiceDiv
        document.getElementById(`upload_${uploadNumber}_fullAlbumResolutionChoiceDiv`).appendChild(resOptions)

        //if padding option changes, update resolution options
        $(`#upload_${uploadNumber}_fullAlbumPaddingChoices`).on('change', function () {
            let paddingChoice = $(this).val();
            console.log('paddingChoice = ', paddingChoice)
            //get image choice
            let imageChoiceNum = $(`#upload_${uploadNumber}_fullAlbumImgChoice`).val();
            let imageChoiceName = uploadFiles.images[imageChoiceNum].name;
            console.log('img choice = ', imageChoiceName);
            //generate new resolution options
            let newResOptions = generateResolutionOptions(null, null);
            //create new resolution div
            const container = document.querySelector(`#upload_${uploadNumber}_fullAlbumResolutionChoiceDiv`);
            //remove all child nodes from resolutions div
            removeAllChildNodes(container);
            //append resolution options
            document.getElementById(`upload_${uploadNumber}_fullAlbumResolutionChoiceDiv`).appendChild(newResOptions)
        });

        //if image selection changes, update resolution options
        $(`#upload_${uploadNumber}_fullAlbumImgChoice`).on('change', function () {
            //get image info
            let newImageNum = $(this).val();
            let newImageName = uploadFiles.images[newImageNum].name;
            //get padding info
            let paddingChoice = $(`#upload_${uploadNumber}_fullAlbumPaddingChoices`).val();
            console.log('img changed paddingChoice = ', paddingChoice)
            //if padding is not 'none', generate dropdown with static resolutions
            let newResOptions;
            if (!paddingChoice.includes('none')) {
                newResOptions = generateResolutionOptions(null, null);
            } else {
                newResOptions = generateResolutionOptions(uploadImageResolutions, newImageName);
            }
            //create new resolution div
            const container = document.querySelector(`#upload_${uploadNumber}_fullAlbumResolutionChoiceDiv`);
            //remove all child nodes from resolutions div
            removeAllChildNodes(container);
            //append resolution options
            document.getElementById(`upload_${uploadNumber}_fullAlbumResolutionChoiceDiv`).appendChild(newResOptions)


        });

        //create dataset
        let data = await createDataset(uploadFiles, uploadNumber)

        var reorder = false;
        var searched = false;
        var origIndexes = [];
        var origSeq = [];
        var origNim = [];

        var table = $(`#upload_${uploadNumber}_table`).DataTable({
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
                //{ "data": "imgSelection" },
                //{ "data": "outputFormat" },
                { "data": "audioFilepath" },
                { "data": "trackNum" }
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
                { //image selection
                    targets: 5,
                    type: "string",
                    orderable: false,
                    className: 'text-left'
                },
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
                }
            ],
            "language": {
                "emptyTable": "No files in this upload"
            },
            dom: 'rt',
            rowReorder: {
                dataSrc: 'sequence',
            },

        });

        var count = 1;
        data.forEach(function (i) {
            table.row.add({
                "sequence": i.itemId,
                "#": `<div style='cursor: pointer;'><i class="fa fa-bars"></i> ${count}</div>`,
                "selectAll": '<input type="checkbox">',
                "audio": i.audio,
                //"format": 'adasd',//i.format,
                "length": i.length,
                //"imgSelection": i.imgSelection,
                //"outputFormat": i.vidFormatSelection,
                //"outputLocation": "temp output location",
                "audioFilepath": i.audioFilepath,
                "trackNum": i.trackNum,
            }).node().id = 'rowBrowseId' + i.sampleItemId;
            count++;
        });
        table.draw();

        //image selection changed
        $(`#upload-${uploadNumber}-imageOptionsCol`).change(function (event) {
            //console.log(`upload-1-imageOptionsCol clicked`)
            let indexValueImgChoice = $(`#upload-${uploadNumber}-imageOptionsCol`).val()
            //console.log('set all to ', indexValueImgChoice)
            table.rows().eq(0).each(function (index) {

                //console.log('index = ', index)
                document.getElementById(`upload_${uploadNumber}_table-audio-${index}-img_choice`).selectedIndex = `${indexValueImgChoice}`
            });
        });

        /*
        //prevent clicking form selection from selecting/deselcting row
        $(`#upload_${uploadNumber}_table tbody`).on( 'click', 'select', function (e) {
            e.stopPropagation();
          } );
        */

        $(`#upload_${uploadNumber}_fullAlbumButton`).on('click', async function (e) {
            let resolution = $(`#upload_${uploadNumber}_fullAlbumResolutionChoice option:selected`).text();
            resolution = (resolution.split(" ")[0]).trim()
            let padding = ($(`#upload_${uploadNumber}_fullAlbumPaddingChoices`).val()).trim();
            fullAlbum(`upload-${uploadNumber}`, uploadNumber, resolution, padding)
        })

        //let concatAudioFfmpegCommand = await generateConcatAudioCommand(ffmpeg, selectedRows, outputFile)
        //console.log('concatAudioFfmpegCommand = ', concatAudioFfmpegCommand)

        //select all checkbox clicked
        $(`#upload_${uploadNumber}_table-selectAll`).on('click', function (event) {
            let checkedStatus = document.getElementById(`upload_${uploadNumber}_table-selectAll`).checked
            if (checkedStatus == true) {
                //box is going from unchecked to checked, so select all
                var rows = table.rows().nodes();
                $('input[type="checkbox"]', rows).prop('checked', true);
                table.$("tr").addClass('selected')
            } else {
                //unselect all
                var rows = table.rows().nodes();
                $('input[type="checkbox"]', rows).prop('checked', false);
                table.$("tr").removeClass('selected')


            }

            updateFullAlbumDisplayInfo(table, uploadNumber)

        });

        //row clicked
        $(`#upload_${uploadNumber}_table tbody`).on('click', 'tr', function () {
            //determine whether or not to select/deselect & check/uncheck row
            //var count = $(`#upload_${uploadNumber}_table`).find('input[type=checkbox]:checked').length;
            //document.getElementById(`upload_${uploadNumber}_numChecked`).innerText = count
            //document.getElementById(`upload_${uploadNumber}_numCheckedFullAlbum`).innerText = count

            var isSelected = $(this).hasClass('selected')
            $(this).toggleClass('selected').find(':checkbox').prop('checked', !isSelected);

            updateFullAlbumDisplayInfo(table, uploadNumber)



        });

        //video output format selection changed
        $(`#upload_${uploadNumber}_table-vidFormat-col`).change(function (event) {
            //console.log(`#upload_${uploadNumber}_table-vidFormat-col clicked`)
            let indexValueImgChoice = $(`#upload_${uploadNumber}_table-vidFormat-col`).val()
            var rowNum = table.data().count();
            //console.log('rowNum = ', rowNum)
            //for(var x = 0; x < rowNum; x++){
            //    document.getElementById(`upload_${uploadNumber}_table-vidFormat-row_${x}`).selectedIndex = `${indexValueImgChoice}`
            //}
            //table.rows().eq(0).each( function ( index ) {
            //var elem = document.getElementById(`upload_${uploadNumber}_table-vidFormat-row_${index}`)
            //console.log(`elem = `, elem)
            //console.log(`elem.selectedIndex = `, elem.selectedIndex)
            //document.getElementById(`upload_${uploadNumber}_table-vidFormat-row_${index}`).selectedIndex = `${indexValueImgChoice}`
            //elem.selectedIndex = 1
            //setAllVidFormats(uploadNum, indexValueImgChoice)
            //} );
            //document.getElementById(`upload_1_table-vidFormat-row_2`).selectedIndex = 1

            setAllVidFormats(uploadNumber, rowNum, indexValueImgChoice)
        });

        $(`#upload_${uploadNumber}_table-vidLocationButton`).on('click', function (event) {
            $(`#upload_${uploadNumber}_table-vidLocation`).click()
        })

        $(`#upload_${uploadNumber}_table-vidLocation`).change(function (event) {
            var filePath = document.getElementById(`upload_${uploadNumber}_table-vidLocation`).files[0].path
            //console.log('filePath = ', filePath)
            //console.log('process.platform  =', process.platform)
            if ((process.platform).includes('win')) {
                var parseChar = "\\"
            }
            var path = (filePath.substring(0, filePath.lastIndexOf(parseChar))) + parseChar
            //console.log('path = ', path)
            document.getElementById(`upload_${uploadNumber}_table-vidLocationButton`).innerText = path

        })

        table.on('order.dt', function (e, diff, edit) {
            //console.log('order', reorder, searched);

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
            //console.log('row-reorder');
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

        resolve()
    })
}

//render individual videos for an upload
async function renderIndividual(uploadNumber) {
    console.log('renderIndividual()')
    //get table
    var table = $(`#upload_${uploadNumber}_table`).DataTable()
    //get upload from uploadList
    var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
    var upload = uploadList[`upload-${uploadNumber}`]
    //get all selected rows
    var selectedRows = table.rows('.selected').data()
    //get output filepath
    var path = require('path');
    var outputDir = path.dirname(selectedRows[0].audioFilepath)
    /*
        Get video options
    */
    //get padding value
    let padding = ($(`#upload_${uploadNumber}_fullAlbumPaddingChoices`).val()).trim();
    //get resolution value
    let resolution = $(`#upload_${uploadNumber}_fullAlbumResolutionChoice option:selected`).text();
    resolution = (resolution.split(" ")[0]).trim()
    //get input img filepath 
    let imgChoice = document.getElementById(`upload_${uploadNumber}_fullAlbumImgChoice`).value
    let imgInput = upload.files.images[imgChoice].path

    //for each selected row
    for (var i = 0; i < selectedRows.length; i++) {
        //get song number:
        let songNum = (selectedRows[i].sequence) - 1
        
        //get img selection
        //let imgChoice = document.getElementById(`upload_${uploadNumber}_table-audio-${songNum}-img_choice`).value
        //let imgInput = upload.files.images[imgChoice].path

        //get input audio filename without file extension/type at end
        let songName = selectedRows[i].audio.substr(0, selectedRows[i].audio.lastIndexOf("."));
        let audioFilepath = selectedRows[i].audioFilepath
        //get fileType
        let fileType = selectedRows[i].audio.substr(selectedRows[i].audio.lastIndexOf(".")+1, selectedRows[i].audio.length);
        console.log('fileType = ', fileType)
        //if filetype = flac or m4a
        if (fileType == 'flac' || fileType == 'm4a') {
            //convert to mp3
            var timestamp = new Date().getUTCMilliseconds();
            audioFilepath = `${outputDir}${path.sep}${songName}-convertedAudio.mp3`;
            /*
            
            */
            await combineMp3FilesOrig([selectedRows[i]], audioFilepath, '320k', timestamp, uploadNumber, 'IndividualRender');
        }

        //create converted audio output filename
        //let convertedAudioOutput = `${outputDir}${path.sep}${songName}-convertedAudio.mp3`
        //await combineMp3FilesOrig(selectedRows[i], outputFilepath, '320k', timestamp, uploadNumber);

        //create video output filename
        let vidOutput = `${outputDir}${path.sep}${songName}.mp4`
        //console.log('vidOutput=', vidOutput)
        //render vid
        let updateInfoLocation = `upload_${uploadNumber}_IndividualRenderStatus`
        document.getElementById(updateInfoLocation).innerHTML = ''
        await generateVid(audioFilepath, imgInput, vidOutput, updateInfoLocation, resolution, padding)

        if (fileType == 'flac' || fileType == '.m4a') {

            //delete converted mp3 file
            deleteFile(audioFilepath)
        }

    }

    //get upload from upload-list
    //get all selected rows
}

async function runFfmpegCommand(ffmpegArgs, cutDuration){
    return new Promise(async function (resolve, reject) {
        const getFfmpegPath = () => getFfPath('ffmpeg');
        const getFfprobePath = () => getFfPath('ffprobe');
        const ffmpegPath = getFfmpegPath();
        console.log('runFfmpegCommand() ffmpegPath = ', ffmpegPath)
        const process = execa(ffmpegPath, ffmpegArgs);
        handleProgress(process, cutDuration);
        const result = await process;
        resolve(result);
    })
}

//render a full album upload
async function fullAlbum(uploadName, uploadNumber, resolution, padding) {
    document.getElementById(`upload_${uploadNumber}_fullAlbumStatus`).innerText = 'Generating Audio: 0%'
    //get table
    var table = $(`#upload_${uploadNumber}_table`).DataTable()
    //get all selected rows
    var selectedRows = table.rows('.selected').data()
    //get outputFile location
    var path = require('path');
    var outputDir = path.dirname(selectedRows[0].audioFilepath)
    //create outputfile
    var timestamp = new Date().getUTCMilliseconds();
    let outputFilepath = `${outputDir}${path.sep}output-${timestamp}.mp3`

    let concatCmdInfo = await createFfmpegCmd(
        "concatMp3",
        {
          selectedRows:selectedRows,
          outputFilepath:outputFilepath
        }
    );
    let concatMp3Length = concatCmdInfo.duration;
    //run command 
    console.log('BEGIN FFMPEG AUDIO CONCAT COMMAND')
    let runFfmpegCommandResp = await runFfmpegCommand(concatCmdInfo.args, concatMp3Length);
    console.log('END FFMPEG AUDIO CONCAT COMMAND. runFfmpegCommandResp = ', runFfmpegCommandResp)

    //get img input filepath
    var uploadList = await JSON.parse(localStorage.getItem('uploadList'))
    var upload = uploadList[`upload-${uploadNumber}`]
    let imgChoice = document.getElementById(`upload_${uploadNumber}_fullAlbumImgChoice`).value
    let imgInput = upload.files.images[imgChoice].path
    //create vid output filepath
    let vidOutput = `${outputDir}${path.sep}fullAlbum-${timestamp}.mp4`
    //create command to generate vid
    let vidCmdInfo = await createFfmpegCmd(
        "vid",
        {
          inputAudio:outputFilepath,
          inputImg:imgInput,
          outputFilepath:vidOutput,
          resolution:resolution,
          padding:padding, 
        }
    )
    //run command 
    console.log('BEGIN FFMPEG VID GENERATE COMMAND')
    runFfmpegCommandResp = await runFfmpegCommand(vidCmdInfo.args, concatMp3Length);
    console.log('END FFMPEGVID GENERATE COMMAND. runFfmpegCommandResp = ', runFfmpegCommandResp)
    //delete audio file
    deleteFile(outputFilepath)
    
    //console.log('after caclling deleting file')
}

//delete file on the user's machine
function deleteFile(path) {
    //console.log('deleteFile()')
    const fs = require('fs')
    fs.unlink(path, (err) => {
        if (err) {
            console.error("err deleting file = ", err)
            return
        }


        //console.log('file removed')

        //file removed
    })
}

async function apiRouteTest() {
    console.log('api route')
}

async function getResolution(imagePath) {
    return new Promise(async function (resolve, reject) {
        try {
            var sizeOf = require('image-size');

            sizeOf(imagePath, function (err, dimensions) {
                if (!err) {
                    width = dimensions.width;
                    height = dimensions.height
                    resolve([width, height]);
                } else {
                    console.log('err getting img dimmensions:', err)
                    reject(err)
                }
            });
        } catch (err) {
            console.log('err getting dimmensions:', err)
            reject(err)
        }
    });
}

function calculateResolution(oldWidth, oldHeight, newWidth) {
    let aspectRatio = oldWidth / oldHeight;
    let newHeight = newWidth / aspectRatio
    return ([Math.round(newWidth), Math.round(newHeight)])
}

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


const { join, extname } = window.require('path');
//new ffmpeg functions:
function getFfCommandLine(cmd, args) {
    const mapArg = arg => (/[^0-9a-zA-Z-_]/.test(arg) ? `'${arg}'` : arg);
    return `${cmd} ${args.map(mapArg).join(' ')}`;
}

function getFfPath(cmd) {
    try{
        const isDev = window.require('electron-is-dev');
        const os = window.require('os');
        const platform = os.platform();
        console.log("getFfPath() platform = ", platform)
        if (platform === 'darwin') {
          return isDev ? `ffmpeg-mac/${cmd}` : join(window.process.resourcesPath, cmd);
        }
      
        const exeName = platform === 'win32' ? `${cmd}.exe` : cmd;
        return isDev
          ? `node_modules/ffmpeg-ffprobe-static/${exeName}`
          : join(window.process.resourcesPath, `node_modules/ffmpeg-ffprobe-static/${exeName}`);
    }catch(err){
        console.log('getFfPath cmd=', cmd, '. err = ', err)
        return("")
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

async function createFfmpegCmd(type, inputArgs){
    return new Promise(async function (resolve, reject) {
        let cmdArr = [];
        let outputDuration = 0;
        try{
            if(type=="concatMp3"){
                let selectedRows = inputArgs.selectedRows;
                let outputFilepath = inputArgs.outputFilepath;
                //add inputs
                let inputs = '';
                outputDuration = 0;
                for (var i = 0; i < selectedRows.length; i++) {
                    cmdArr.push('-i')
                    cmdArr.push(`${selectedRows[i].audioFilepath}`)
                    console.log('selectedRows[i] = ', selectedRows[i])
                    inputs = `${inputs}-i "${selectedRows[i].audioFilepath}" `

                    //calculate total time
                    var lengthSplit = selectedRows[i].length.split(':'); // split it at the colons
                    // minutes are worth 60 seconds. Hours are worth 60 minutes.
                    var seconds = (+lengthSplit[0]) * 60 * 60 + (+lengthSplit[1]) * 60 + (+lengthSplit[2]); 
                    outputDuration = outputDuration + seconds
                }

                //add concat options
                cmdArr.push("-y");
                cmdArr.push("-filter_complex")
                cmdArr.push(`concat=n=${i}:v=0:a=1`)
                //add audio codec and quality 
                cmdArr.push("-c:a")
                cmdArr.push("libmp3lame")
                cmdArr.push("-b:a")
                cmdArr.push("320k")
                //set output 
                cmdArr.push(outputFilepath);

            }else if(type=="vid"){
                /* INPUTS=
          inputAudio:outputFilepath,
          inputImg:imgInput,
          outputFilepath:vidOutput,
          resolution:resolution,
          padding:padding, 
                */
               console.log('inputArgs = ', inputArgs)
                cmdArr.push('-loop') 
                cmdArr.push('1')
                cmdArr.push('-framerate') 
                cmdArr.push('2')
                cmdArr.push('-i')
                cmdArr.push(`${inputArgs.inputImg}`)
                cmdArr.push('-i')
                cmdArr.push(`${inputArgs.inputAudio}`)
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
                cmdArr.push(`scale=w=${inputArgs.resolution.split('x')[0]}:h=${inputArgs.resolution.split('x')[1]}`) 
                cmdArr.push('-preset') 
                cmdArr.push('medium') 
                cmdArr.push('-tune') 
                cmdArr.push('stillimage') 
                cmdArr.push('-crf') 
                cmdArr.push('18') 
                cmdArr.push('-pix_fmt') 
                cmdArr.push('yuv420p') 
                cmdArr.push('-shortest') 
                cmdArr.push(`${inputArgs.outputFilepath}`)
                /* no padding
ffmpeg 
-loop 1 
-framerate 2 
-i C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\front.jpg 
-i C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\output-655.mp3 
-y -acodec copy 
-b:a 320k 
-vcodec libx264 
-b:v 8000k 
-maxrate 8000k 
-minrate 8000k 
-bufsize 3M 
-filter:v 
scale=w=1920:h=1910 
-preset medium 
-tune stillimage 
-crf 18 
-pix_fmt yuv420p 
-shortest 
C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\fullAlbum-655.mp4
                */
                               /* yes padding

                ffmpeg 
                -loop 1 
                -framerate 2 
                -i C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\front.jpg 
                -i C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\output-675.mp3 
                -y -acodec copy 
                -b:a 320k -vcodec libx264 
                -b:v 8000k 
                -maxrate 8000k 
                -minrate 8000k 
                -bufsize 3M -filter:v 
                scale=w='if(gt(a,1.7777777777777777),1920,trunc(1080*a/2)*2)':h='if(lt(a,1.7777777777777777),1080,trunc(1920/a/2)*2)',pad=w=1920:h=1080:x='if(gt(a,1.7777777777777777),0,(1920-iw)/2)':y='if(lt(a,1.7777777777777777),0,(1080-ih)/2)':color=white 
                -preset medium 
                -tune stillimage -crf 18 -pix_fmt yuv420p -shortest C:\Users\marti\Documents\martinradio\uploads\Andy Cole Outstanding\fullAlbum-675.mp4
                */

            }
            //create respObj
            let respObj = {
                args:cmdArr, 
                duration:outputDuration
            }
            //return respObj
            resolve(respObj)
        }catch(err){
            console.log("createFfmpegCmd() err = ", err)
            reject(err)
        }
    });
}

const moment = window.require("moment");
const readline = window.require('readline');
function handleProgress(process, cutDuration) {
    //onProgress(0);
  
    const rl = readline.createInterface({ input: process.stderr });
    rl.on('line', (line) => {
        console.log('progress', line);
  
      try {
        let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
        // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
        if (!match) match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
        if (!match) return;
  
        const str = match[1];
        console.log(str);
        const progressTime = Math.max(0, moment.duration(str).asSeconds());
        console.log(progressTime);
        const progress = cutDuration ? progressTime / cutDuration : 0;
        console.log('progress = ', progress)
        //onProgress(progress);
      } catch (err) {
        console.log('Failed to parse ffmpeg progress line', err);
      }
    });
}
const execa = window.require('execa');
//generate video using image and audio
async function generateVid(audioPath, imgPath, vidOutput, updateInfoLocation, resolution, padding) {
    return new Promise(async function (resolve, reject) {
        console.log('generateVid \n audioPath = ', audioPath, ' \n \n imgPath = ', imgPath, ' \n \n vidOutput = ', vidOutput, `, \n \n resolution = [${resolution}], \n \n padding=${padding}`)

        let ffmpegCmdString = '["-hide_banner","-i","/Users/martinbarker/Documents/testfiles/The Hard Workers – Hola! Hola!/fullAlbum-577.mp4","-c","copy","-map","0:0","-map_metadata","0","-movflags","+faststart","-ignore_unknown","-f","mp4","-y","/Users/martinbarker/Documents/testfiles/NEWWOWIEfullAlbum-577-00.00.00.000-00.05.06.500-seg1.mp4"]';
        let tempffmpegArgs = JSON.parse(ffmpegCmdString);

        const ffmpegCommandLine = getFfCommandLine('ffmpeg', tempffmpegArgs);
        console.log('ffmpegCommandLine=', ffmpegCommandLine)

        //cutDuration = length in seconds of video (float)
        cutDuration=306.13

        const getFfmpegPath = () => getFfPath('ffmpeg');
        const getFfprobePath = () => getFfPath('ffprobe');
        const ffmpegPath = getFfmpegPath();
        console.log('ffmpegPath = ', ffmpegPath)
        const process = execa(ffmpegPath, tempffmpegArgs);
        handleProgress(process, cutDuration);
        const result = await process;
        console.log(result.stdout);

        /*
        if (updateInfoLocation) {
            console.log('updateInfoLocation found')
            document.getElementById(updateInfoLocation).innerText = `Generating Video: 0%`
        }

        //begin get ffmpeg info
        const ffmpeg = require('fluent-ffmpeg');
        //Get the paths to the packaged versions of the binaries we want to use
        var ffmpegPath = require('ffmpeg-static-electron').path;
        ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
        var ffprobePath = require('ffprobe-static-electron').path;
        ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked')
        //tell the ffmpeg package where it can find the needed binaries.
        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);
        //end set ffmpeg info

        if(padding != "none"){
            ffmpeg()
            .input(imgPath)
            .loop()
            .addInputOption('-framerate 2')
            .input(audioPath)
            .videoCodec('libx264')
            .audioCodec('copy')
            .audioBitrate('320k')
            .videoBitrate('8000k', true)
            .size(resolution).autopad(padding)
            
            .outputOptions([
                '-preset medium',
                '-tune stillimage',
                '-crf 18',
                '-pix_fmt yuv420p',
                '-shortest'
            ])
            //.size('50%')

            .on('progress', function (progress) {
                if (progress.percent) {
                    if (updateInfoLocation) {
                        document.getElementById(updateInfoLocation).innerText = `Generating Video: ${Math.round(progress.percent)}%`
                    }
                } else {
                    if (updateInfoLocation) {
                        document.getElementById(updateInfoLocation).innerText = `Generating Video...`
                    }
                }
                console.info(`vid() Processing : ${progress.percent} % done`);
            })
            .on('codecData', function (data) {
                console.log('vid() codecData=', data);
            })
            .on('end', function () {
                if (updateInfoLocation) {
                    document.getElementById(updateInfoLocation).innerText = `Video generated.`
                }
                console.log('vid()  file has been converted succesfully; resolve() promise');
                resolve();
            })
            .on('error', function (err) {
                if (updateInfoLocation) {
                    document.getElementById(updateInfoLocation).innerText = `Error generating video.`
                }
                console.log('vid() an error happened: ' + err.message, ', reject()');
                reject(err);
            })
            .output(vidOutput).run()
        }else{
            ffmpeg()
            .input(imgPath)
            .loop()
            .addInputOption('-framerate 2')
            .input(audioPath)
            .videoCodec('libx264')
            .audioCodec('copy')
            .audioBitrate('320k')
            .videoBitrate('8000k', true)
            .size(resolution)
            
            .outputOptions([
                '-preset medium',
                '-tune stillimage',
                '-crf 18',
                '-pix_fmt yuv420p',
                '-shortest'
            ])
            //.size('50%')

            .on('progress', function (progress) {
                if (progress.percent) {
                    if (updateInfoLocation) {
                        document.getElementById(updateInfoLocation).innerText = `Generating Video: ${Math.round(progress.percent)}%`
                    }
                } else {
                    if (updateInfoLocation) {
                        document.getElementById(updateInfoLocation).innerText = `Generating Video...`
                    }
                }
                console.info(`vid() Processing : ${progress.percent} % done`);
            })
            .on('codecData', function (data) {
                console.log('vid() codecData=', data);
            })
            .on('end', function () {
                if (updateInfoLocation) {
                    document.getElementById(updateInfoLocation).innerText = `Video generated.`
                }
                console.log('vid()  file has been converted succesfully; resolve() promise');
                resolve();
            })
            .on('error', function (err) {
                if (updateInfoLocation) {
                    document.getElementById(updateInfoLocation).innerText = `Error generating video.`
                }
                console.log('vid() an error happened: ' + err.message, ', reject()');
                reject(err);
            })
            .output(vidOutput).run()
        }
        */


    })
}

//combine multiple audio files into one long audio file
async function combineMp3FilesOrig(selectedRows, outputFilepath, bitrate, timestamp, uploadNumber, type = 'fullAlbum') {
    console.log(`combineMp3FilesOrig(): ${outputFilepath}`)

    //begin get ffmpeg info
    const ffmpeg = require('fluent-ffmpeg');
    //Get the paths to the packaged versions of the binaries we want to use
    var ffmpegPath = require('ffmpeg-static-electron').path;
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
    var ffprobePath = require('ffprobe-static-electron').path;
    ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked')
    //tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    //end set ffmpeg info

    //~~~~~~~~ NEW ~~~~~~~~
    return new Promise((resolve, reject) => {
        //create ffmpeg command
        const command = ffmpeg();
        //add inputs
        let inputStr = ''
        for (var i = 0; i < selectedRows.length; i++) {
            console.info(`combineMp3FilesOrig() adding  ${selectedRows[i].audioFilepath} to input`);
            command.input(selectedRows[i].audioFilepath);
            inputStr = `${inputStr}[${i}:a:0]`
        }
        //console.log(`combineMp3FilesOrig() i=${i}, inputStr=${inputStr}`)
        //add progress updates
        command.on('progress', function (progress) {
            console.info(`combineMp3FilesOrig() Processing : ${progress.percent} % done`);
            document.getElementById(`upload_${uploadNumber}_${type}Status`).innerText = `Generating Audio: ${Math.round(progress.percent)}%`
        })
            .on('start', function (command) {
                console.log('combineMp3FilesOrig() start, command=', command);
            })
            .on('codecData', function (data) {
                console.log('combineMp3FilesOrig() codecData=', data);
            })
            .on('end', function () {
                console.log('combineMp3FilesOrig() finished');
                document.getElementById(`upload_${uploadNumber}_${type}Status`).innerText = `Audio generated.`
                resolve();
            })
            .on('error', function (err) {
                console.log('combineMp3FilesOrig() err=', err);
                document.getElementById(`upload_${uploadNumber}_${type}Status`).innerText = `Error generating audio.`
                reject(err)
            });
        command.output(outputFilepath)
        //add output
        command.complexFilter([
            {
                "filter": "concat",
                "options": {
                    "n": `${i}`,
                    "v": "0",
                    "a": "1",
                },
                "input": `${inputStr}`
            }
        ])
        //command.mergeToFile(outputFilepath);
        command.audioBitrate(bitrate)
        command.run();
    });

    console.log(`combineMp3FilesOrig(): end of function`)
}

//update full album button info in an upload
async function updateFullAlbumDisplayInfo(table, uploadNumber) {
    //get all selected rows
    var selectedRows = table.rows('.selected').data()
    //get number of selected tracks
    var count = selectedRows.length;
    //get total length of full album vid
    var fullAlbumLength = ''
    var fullAlbumTracklist = ''
    for (var i = 0; i < count; i++) {
        fullAlbumTracklist = `${fullAlbumTracklist}${selectedRows[i].audio}<br>`
        //set prevTime
        var prevTime = ''
        if (fullAlbumLength == '') {
            prevTime = '0:00:00'
        } else {
            prevTime = fullAlbumLength
        }
        //set currTime
        var currTime = selectedRows[i].length
        //calculate sum
        fullAlbumLength = sum(prevTime, currTime);
    }
    //set fullAlbumLength var
    document.getElementById(`upload_${uploadNumber}_fullAlbumLength`).innerText = fullAlbumLength
    //get tracklist

    //set tracklist
    document.getElementById(`upload_${uploadNumber}_fullAlbumTracklist`).innerHTML = fullAlbumTracklist

    //set count
    document.getElementById(`upload_${uploadNumber}_numChecked`).innerText = count
    document.getElementById(`upload_${uploadNumber}_numCheckedFullAlbum`).innerText = count

}

//update which uploads are displayed
async function updateUploadListDisplay() {
    let uploadListDisplay = document.getElementById('uploadList')

    //get uploadList from localstorage
    var uploadList = await JSON.parse(localStorage.getItem('uploadList'))

    console.log('~ updateUploadListDisplay() uploadList = ', uploadList)

    //if uploadList exists
    if (uploadList != null) {

        //for each object in uploadList
        for (const [key, value] of Object.entries(uploadList)) {
            let uploadId = key
            let uploadTitle = value.title
            let uploadFiles = value.files
            uploadNumber = key.split('-')[1]
            console.log('~ updateDisplay() uploadNumber = ', uploadNumber)
            //if div with id = upload-${uploadNumber} does not exist:
            var uploadObj = uploadList[uploadId];//document.getElementById(`upload-${uploadNumber}`)
            console.log("~ updateUploadListDisplay() uploadObj = ", uploadObj)
            //if (uploadObj == null) {
            //console.log('~ updateUploadListDisplay() add to display: ', key, ', ', value)
            await createNewUploadCard(uploadTitle, uploadNumber, uploadFiles)
            //} else {
            //console.log('~ updateUploadListDisplay() dont add already visible: ', key, ', ', value)
            //}




            //console.log('updateUploadListDisplay() newUploadCard = ', newUploadCard)

            //uploadListDisplay.appendChild(newUploadCard);
            //console.log(`    ${key}: ${value}`);
            //uploadListDisplay.innerHTML = uploadListDisplay.innerHTML + `[${key}]-${JSON.stringify(value)}]<br><hr>`
        }
    } else {
        //console.log('~ updateUploadListDisplay() uploadList = null')
    }

}

//add new upload to uploadList
async function addToUploadList(uploadKey, uploadValue) {
    return new Promise(async function (resolve, reject) {

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
        resolve('done')
    })
}

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

    //sort all files into audio / images 
    for (const f of event.dataTransfer.files) {
        // Using the path attribute to get absolute file path 
        if ((f.type).includes('image')) {
            //if image filepath does not already exist in newUploadTempFiles:
            if (fileList.images.filter(e => e.path === `${f.path}`).length == 0) {
                fileList.images.push({ 'path': f.path, 'type': f.type, 'name': f.name })
                haveNewFilesBeenAdded = true;
            }

        } else if ((f.type).includes('audio')) {
            let audioFileInfo = {};
            console.log('audioFileInfo = ', audioFileInfo)
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
                haveNewFilesBeenAdded = true;
            }
        }
    }
    console.log('newUploadFileDropEvent() fileList = ', fileList)
    newUploadFiles = fileList;
    console.log('newUploadFileDropEvent() newUploadFiles = ', newUploadFiles)

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

async function getMetadata(filename) {
    const metadata = await ipcRenderer.invoke('get-audio-metadata', filename);
    console.log(`Music-metadata: track-number = ${metadata.common.track.no}, duration = ${metadata.format.duration} sec.`);
    return metadata;
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
