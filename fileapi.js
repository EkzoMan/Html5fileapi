var uploader = {
  
    container: undefined,
    multipleUploadAllowed: false,
        
    init: function(container,multipleFilesUpload){
        var container = document.getElementById(container);
        if(container === undefined) return false;
        
        uploader.container = container;
        uploader.multipleUploadAllowed = multipleFilesUpload;
        
        var input = document.createElement('input'),
            uploadButton = document.createElement('input'),
            browseButton = document.createElement('input'),
            uploadForm = document.createElement('form');
        if(multipleFilesUpload) input.setAttribute('multiple','multiple');
        
        input.setAttribute('id','uploader');
        input.setAttribute('type','file');
        input.addEventListener('change',function(e){
            console.log('Input selection changed');
            uploader.rebuildFilesList();
            
        });
        
        uploadButton.setAttribute('type',uploader.isFileApiSupported ? 'button' : 'submit');
        uploadButton.setAttribute('value','Upload');
        uploadButton.setAttribute('id','sendFilesBtn');
        
        browseButton.setAttribute('type','button');
        browseButton.setAttribute('value','Browse...');
        browseButton.setAttribute('id','browseButton');
        browseButton.addEventListener('click',function(e){
            uploader.fireEvent(document.getElementById('uploader'),'click');
        });
        
        uploadForm.setAttribute('type','post');
        uploadForm.setAttribute('enctype','multipart/form-data');
        uploadForm.setAttribute('action','');
        
        if(uploader.isFileApiSupported){
            input.style.width = '0px';
            input.style.height = '0px';
            container.appendChild(input);
            container.appendChild(browseButton);
            container.appendChild(uploadButton);
        }
        else{
            uploadForm.appendChild(input);
            uploadForm.appendChild(uploadButton);
            container.appendChild(uploadForm);   
        }
    },
    
    rebuildFilesList: function(){
        var uploadInput = document.getElementById('uploader');
        var isNewList = document.getElementById('uploadFilesList') == null,
            filesList = document.getElementById('uploadFilesList');
        
        if(isNewList){
            filesList = document.createElement('ul');
            filesList.setAttribute('id','uploadFilesList');
            uploader.container.appendChild(filesList);
        }
        
        if(uploadInput.files.length > 0)
        {
            if(!uploader.multipleUploadAllowed)
                while(filesList.childElementCount > 0)
                    filesList.removeChild(filesList.children[0]);
                
            for(var i = 0; i < uploadInput.files.length; i++)
            {
                if(document.getElementById(uploadInput.files[i].name)==null){
                    var li = document.createElement('li');   
                    li.setAttribute('id',uploadInput.files[i].name);
                    li.setAttribute('data-position','0');
                    li.setAttribute('data-size',uploadInput.files[i].size);
                    li.files = uploadInput.files[i];
                    li.innerHTML = uploadInput.files[i].name;
                    filesList.appendChild(li);
                }
                else
                    console.log('File already in list. File skipped.');
            }
                
        }
    },
    
    destroy: function(){
        while(uploader.container.childElementCount > 0)
            uploader.container.removeChild(uploader.container.children[0]);
    },
    
    isFileApiSupported: function(){
      return (window.File && window.FileReader && window.FileList && window.Blob);  
    },
  
    fireEvent: function triggerEvent(el, type)
    {
        if ((el[type] || false) && typeof el[type] == 'function')
        {
            el[type](el);
        }
    }
    
};