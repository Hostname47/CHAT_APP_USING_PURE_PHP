
$(".post-to-option").click(function() {
    if(!$(this).find(".rad-opt").is(":disabled")) {
        $(this).parent().find("input[name='post-to']").prop("checked", false);
        $(this).find("input").prop("checked", true);
    }
});

$("#create-post-textual-content").on({
    keyup: function() {
        if($(this).val() != "") {
            $("#post-create-button").css("display", "block");
        } else {
            if($("#create-post-photo-or-video").val() == "") {
                $("#post-create-button").css("display", "none");
            }
        }
    }
});

// This will track image uploads but will take only one image
$("#create-post-photo-or-video").change(function(event) {
    let xmlhttprequest = new XMLHttpRequest();
    xmlhttprequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            if(event.target.files != undefined) {
                $("#post-create-button").css("display", "block");
            } else {
                $("#post-create-button").css("display", "none");
            }

            /* Here first you need to check the incoming data and based on it, you can either decide to show the image or keep it none displayed
            in case it is a malicious file or not an appropriate image*/
            $(".image-post-uploaded-container").append(this.responseText);
            // We search for the last div added and go deep to the image to get the element
            let imgtag = $(".image-post-uploaded-container .post-creation-item").last().find(".image-post-uploaded");
            // FOR NOW LET'S FOCUS ON ONLY ONE IMAGE
            var selectedFile = event.target.files[0];
            var reader = new FileReader();
        
            reader.onload = function(e) {
                imgtag.attr("src", e.target.result);
                $(".delete-uploaded-item").click(function() {
                    // FileList in javascript is readonly So: for now let's botter our heads with only posting one image
                    //Here we need only to remove this image and not all the images in the queue
                    $("#create-post-photo-or-video").val("");
                    $(this).parent().remove();
                    // Also here use the following to remove only the deleted image: $(this).parent().remove();
                    
                    if($("#create-post-textual-content").val() != "") {
                        $("#post-create-button").css("display", "block");
                    } else {
                        $("#post-create-button").css("display", "none");
                    }
                });
            };
        
            reader.readAsDataURL(selectedFile);
        }
    }
    xmlhttprequest.open("GET", "api/general/createpost/create_post_data_item.php", true);
    xmlhttprequest.send();
});

$(".share-post").click(function(event) {
    /*
    I SPENT WITH THAT FEATURE More than 2 Hours in a row and I got a headache so please read the following statement:
    When share-post submit button get clicked we prevent the default behaviour of submitting data to the server
    So we need to get the posted data from the form
    IMPORTANT: when we prevent the default behaviour of submit button this button will not be submitted with the form
    and in the API we based our post task on this buttton so we need to APPEND THIS SUBMIT BUTTON TO THE FORM DATA with it's proper name used in the api (share-post)
                                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    Actually we don't have to :)
    In the api we don't have to check wether the submit button is set or not because we do it here and we only call the 
    api to add a post and because the api is RESTful it has no state or state of button to be depend on
    */

    event.preventDefault();

    $(".share-post").attr('disabled','disabled');
    $(".share-post").attr('value', "POSTING ..");

    let formData = new FormData($("#create-post-form").get(0));

    $.ajax({
        url: $("#create-post-form").attr('action'),
        method: 'POST',
        enctype: 'multipart/form-data',
        contentType: false,
        processData: false,
        data: formData,
        success: function(response){
            $(".share-post").removeAttr('disabled');
            $(".share-post").attr('value', "POST");

            // Clear text
            $("#create-post-textual-content").val("");
            // Remove image template components
            $(".image-post-uploaded-container").find(".post-creation-item").remove();
            // Clear file
            $("#create-post-photo-or-video").val("");

            /*
            IMPORTANT: WHEN token is generated along with the form, we push it to the session server superglobal, But when we
            use this token in the api we use it with Token::check function which check it and delete it when it uses it so we need
            some way to regenrate the token again and assignn it to the token_post as well as to session superglobal so that the 
            user could post 2 posts in the same page without refreshing the page to regenerate the token again
            Aim: when the post created we call other php file through AJAX and generate other token and store it into session and 
            assign it to token_post via javascript
            */

            $(".post-created-message").css("display", "block");
            $(".post-created-message").animate({
                    opacity: 1
            }, 300);
            setTimeout(function() { 
                $(".post-created-message").animate({
                    opacity: 0
                }, 300);
            }, 3000, function() {$(".post-created-message").css("display", "none");});
        },
        error: function(){
            console.log('error');
        }
    });
});

/*
    IMPORTANT: what happens when user click follow button ?
    -> First we check if the user who click the button is the same as the user who is currently logged in by sending the user_id
       to the check file within 'functions/security/check_current_user.php' to check the user, Then we want to make follow
       add as the default behaviour of follow button, If the user who clicks follow is not following the followed user
       we add the follow record and the user follow him successfully. In the other hand if the user is already follow
       him we know that from the response of add api file by checking success array element if the success is return false
       meaning iether the id is not valide or there's already a record with these 2 ids meaning the current user is already
       follow this guy
       In case of failure we asume that there's already follow between the two, so we call delete api file to delete the record
       Note: Notice when a user unfollow another user, that doesn't mean the later one unfollow the first one because the 
       following record only describe one way follow (if A follows B and B follows A and later B unfollow A; A still follows B)
*/
$(".follow-button").click(function(event) {
    event.preventDefault();

    let followButton = $(this);
    let form = $(this).parent();
    let url = root + 'functions/security/check_current_user.php';
    
    // First we check if the current user is valid
    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(),
        success: function(response)
        {
            if(response) {
                // If the current user id is valide the we can add follow record (This basically add some layer of security)
                url = root + "api/follow/add.php";
                $.ajax({
                    type: "POST",
                    url: url,
                    data: form.serialize(),
                    success: function(response)
                    {
                        if(response["success"]) {
                            followButton.removeClass("follow-user");
                            followButton.addClass("followed-user");
                            followButton.attr("value", "Followed");
                        } else {
                            url = root + "api/follow/delete.php";
                            $.ajax({
                                type: "POST",
                                url: url,
                                data: form.serialize(),
                                success: function() {
                                    followButton.removeClass("followed-user");
                                    followButton.addClass("follow-user");
                                    followButton.attr("value", "Follow");
                                }
                            });
                        }
                    }
                });
            } else {
                console.log("ID changed ! error.");
            }
        }
    });
})