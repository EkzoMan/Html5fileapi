var uploader = {

    container: undefined,
    multipleUploadAllowed: false,
    uploadBlockSize: 4096000,
    unloadedFiles: 0,
    uploadErrors: 0,
    uploadURL: '',
    uploadButtonText: 'Отправить',
    browseButtonText: 'Обзор...',

    init: function (container, multipleFilesUpload, url) {
        var container = document.getElementById(container);
        if (container === undefined) return false;

        uploader.uploadURL = url;

        //set local variables
        uploader.container = container;
        uploader.multipleUploadAllowed = multipleFilesUpload;

        //Create general controls
        var input = document.createElement('input'),
            uploadButton = document.createElement('input'),
            browseButton = document.createElement('input'),
            uploadForm = document.createElement('form');

        if (multipleFilesUpload) input.setAttribute('multiple', 'multiple');

        input.setAttribute('id', 'uploader');
        input.setAttribute('type', 'file');
        input.setAttribute('name', 'file');

        //If browser doesn't support File API create submit button for form submitting
        uploadButton.setAttribute('type', uploader.isFileApiSupported() ? 'button' : 'submit');
        uploadButton.setAttribute('value', uploader.uploadButtonText);
        uploadButton.setAttribute('id', 'sendFilesBtn');
        

        browseButton.setAttribute('type', 'button');
        browseButton.setAttribute('value', uploader.browseButtonText);
        browseButton.setAttribute('id', 'browseButton');
        

        uploadForm.setAttribute('method', 'post');
        uploadForm.setAttribute('enctype', 'multipart/form-data');
        uploadForm.setAttribute('encoding', 'multipart/form-data');
        uploadForm.setAttribute('action', uploader.uploadURL);

        if (uploader.isFileApiSupported())  {
            input.addEventListener('change', function (e) {
                console.log('Input selection changed');
                uploader.rebuildFilesList();
            });

            uploadButton.addEventListener('click', function (e) {
                var filesList = document.getElementById('uploadFilesList');
                uploader.uploadErrors = 0;
                if (filesList.childElementCount > 0)
                    for (var i = 0; i < filesList.childElementCount; i++)
                        if (filesList.childNodes[i].uploadObject && !filesList.childNodes[i].uploadObject.uploaded && uploader.isValidFile(filesList.childNodes[i].uploadObject.file)) {
                            uploader.sendFile(uploader.uploadURL, filesList.childNodes[i].uploadObject);
                            uploader.unloadedFiles++;
                        }
            });

            browseButton.addEventListener('click', function (e) {
                uploader.fireEvent(document.getElementById('uploader'), 'click');
            });

            input.style.width = '0px';
            input.style.height = '0px';
            container.appendChild(input);
            container.appendChild(browseButton);
            container.appendChild(uploadButton);
            container.appendChild(document.getElementById('token'));
        }
        else {
            uploadForm.enctype = 'multipart/form-data';
            uploadForm.encoding = 'multipart/form-data';
            uploadForm.appendChild(input);
            uploadForm.appendChild(uploadButton);
            uploadForm.appendChild(document.getElementById('token'));
            container.appendChild(uploadForm);
            if (!uploadForm.addEventListener)
                uploadForm.attachEvent('onsubmit', function () {
                    document.getElementById('loading-box').setAttribute('style', 'display:block');
                    document.getElementsByTagName('form')[0].setAttribute('style', 'display:none');
                });
        }
    },

        rebuildFilesList: function () {
            var uploadInput = document.getElementById('uploader');
            var isNewList = document.getElementById('uploadFilesList') == null,
                filesList = document.getElementById('uploadFilesList');

            if (isNewList) {
                filesList = document.createElement('ul');
                filesList.setAttribute('id', 'uploadFilesList');
                uploader.container.appendChild(filesList);
            }

            if (uploadInput.files.length > 0) {
                //Clear list if multiupload disabled
                if (!uploader.multipleUploadAllowed)
                    while (filesList.childElementCount > 0)
                        filesList.removeChild(filesList.children[0]);

                for (var i = 0; i < uploadInput.files.length; i++) {
                    //If file not in list add it
                    if (document.getElementById(uploadInput.files[i].name) == null) {
                        var li = document.createElement('li');
                        var newLine = document.createElement('br');
                        var progress = document.createElement('progress');
                        progress.setAttribute('min', '0');
                        progress.setAttribute('max', '100');
                        progress.setAttribute('value', '0');
                        progress.setAttribute('class', 'upload-progress');

                        li.setAttribute('id', uploadInput.files[i].name);
                        li.uploadObject = {
                            fileSize: uploadInput.files[i].size,
                            currentPosition: 0,
                            uploaded: false,
                            file: uploadInput.files[i]
                        };
                        li.innerHTML = uploadInput.files[i].name;
                        li.appendChild(newLine);
                        li.appendChild(progress);
                        filesList.appendChild(li);
                    }
                    else
                        console.log('File already in list. File skipped.');
                }
            }
        },

        isValidFile: function(file){
            var isvalid = basicCheck(file) && extendedCheck(file);
            return isvalid;
        
        },

        sliceFile: function (file, start, stop) {
            stop = stop > file.size ? file.size : stop;
            return file.slice(start, stop);
        },

        sendFile: function (url, uploadObject) {
            //New request object
            var xhr = new XMLHttpRequest();

            //EventListner for request state change
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    var result = JSON.parse(this.responseText);
                    var li = document.getElementById(result.id);

                    if (this.status == 200) {                    
                        /* ... this.responseText ... */
                        if (uploadObject.currentPosition < uploadObject.fileSize) {
                        
                            var progress = Math.round((uploadObject.currentPosition * 100) / uploadObject.file.size);
                            var progressBar = li.getElementsByTagName('progress')[0];
                            progressBar.setAttribute('value', progress.toString());

                            uploader.sendFile(url, uploadObject);
                        }
                        else {
                            var progressBar = li.getElementsByTagName('progress')[0];
                            uploader.unloadedFiles--;
                            uploadObject.uploaded = true;
                            li.uploadObject = uploadObject;
                            li.innerHTML = result.message;
                            if (uploader.unloadedFiles == 0) {
                                if (document.getElementById('browseButton').remove) {
                                    document.getElementById('browseButton').remove();
                                    document.getElementById('sendFilesBtn').remove();
                                }
                                else {
                                    var browseButton = document.getElementById('browseButton'),
                                        sendFileButton = document.getElementById('sendFilesBtn');
                                    browseButton.parentNode.removeChild(browseButton);
                                    sendFileButton.parentNode.removeChild(sendFileButton);
                                }
                                uploader.container.innerHTML += '<br/><b>Отправка успешно выполнена</b>';
                                if (uploader.uploadErrors > 0)
                                    uploader.container.innerHTML +='<br />'+ uploader.uploadErrors + ' файлов не загружено из-за ошибок.';
                            }
                        }
                    }
                    else {
                        li.innerHTML = result.message;
                        uploader.uploadErrors++;
                        console.log(result.message);
                        console.log('Request error');
                    }
                }
            };
            /*End eventlistener*/

            var formData = new FormData();
            //Add file part to request
            formData.append('file', uploader.sliceFile(uploadObject.file, uploadObject.currentPosition, uploadObject.currentPosition + uploader.uploadBlockSize));
            //Add file name to request
            formData.append('name', uploadObject.file.name);
            //Set actial cursor position after file slice
            formData.append('currentPosition', uploader.uploadBlockSize > uploadObject.file.size ? uploadObject.file.size : uploadObject.currentPosition + uploader.uploadBlockSize);
            //Add total file size information
            formData.append('totalBytes', uploadObject.file.size);

            //Update object info
            uploadObject.currentPosition = (uploadObject.currentPosition + uploader.uploadBlockSize) > uploadObject.file.size ? uploadObject.file.size : uploadObject.currentPosition + uploader.uploadBlockSize;

            xhr.open('POST', url, true);
            xhr.send(formData);
        },

        destroy: function () {
            while (uploader.container.childElementCount > 0)
                uploader.container.removeChild(uploader.container.children[0]);
        },

        isFileApiSupported: function () {
            //Check browser File API support
            return (window.File && window.FileReader && window.FileList && window.Blob && window.FormData != undefined);
        },

        fireEvent: function triggerEvent(el, type) {
            if ((el[type] || false) && typeof el[type] == 'function') {
                el[type](el);
            }
        }

    };