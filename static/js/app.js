/**
 * PROJECT - Support system panel
 * http://PROJECT.ir
 *
 * Copyright 2014, PROJECT
 * by Vahid Taghizadeh @vah7id
 */

var current_page_user = 0;
var current_page_group = 0;
var current_page_app = 0;
var max_item_list = 12;
var max_users;
var max_groups;
var max_apps;
var fetched_users = false;
var fetched_groups = false;
var fetched_apps = false;

var default_text_search_users = 'بین کاربران جستجو کنید ...';
var default_text_search_groups = 'بین گروه ها جستجو کنید ...';

var groups_mode = false;
var users_mode = true;
var apps_mode = false;

var active_apps_mode = true;
var deactive_apps_mode = false;

// Use grid view if it's false.
var display_list_view = true;

var last_group_id_editing;
var last_user_id_assigning;

var default_item_per_page = 12;

var null_value_array = [undefined, "undefined", null];

var APP_SECTION_COUNTER = 0;
/* ================================= ESSENTIAL FUNCTIONS ================================== */

function beforeSend(pagination){

    $('.loading-cnt').removeClass('hide');

    if(pagination){
        $('.load-more button').html('در حال بارگزاری');
    }

}

function completeAjax(pagination){
    //$('.loading-cnt').addClass('hide');

    if(pagination){
        $('.load-more button').html('بارگزاری نتایج بیشتر');
    }
}

function fadeOutSuccessAlert(){
    $('body').css('overflow','scroll');
    setTimeout(function(){
        $('.notification.success').addClass('hide');
    },5000)
}

function fadeOutErrorAlert(){
    $('body').css('overflow','scroll');
    setTimeout(function(){
        $('.notification.error').addClass('hide');
    },5000)
}

function getUserData(udid){
    // A view to use users application API to get all related details on an
    // specific user from all our databases. This will work async and takes 2.5
    // sec for a complete page.

    // Cleanup previous data.
    $('.user-data-list').html("");
    $.ajax({
        url: '/user/get_data',
        data:{udid:udid},
        type:'POST',
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success: function(response){
            $('#user-data').find('tr').remove();
            $('#modal-userData').addClass('md-show');
            // Make sure response object have true values.
            if(Object.keys(response).length > 1){
                var first_name = response.user.fields.first_name;
                var last_name = response.user.fields.last_name;
                var email = response.user.fields.email;
                var mobile = response.user.fields.mobile_number;
                var f5_status = response.f5.record.status;
                var pay_time = response.f5.invoice.pay_time == null ? '-' : response.f5.invoice.pay_time.substring(0, 19).split("T");
                var expire_date = response.f5.record.due_date == null ? '-' : response.f5.record.due_date.substring(0,19).split("T");
                var promo_code = response.f5.invoice.promo_code == null ? '-': response.f5.invoice.promo_code;
                var change_status = false;
                var status = "";
                switch(f5_status){
                case 1:
                    status = "کاربر جدید";
                    break;
                case 2:
                    status = "فعال";
                    change_status = true;
                    break;
                case 3:
                    status = "پیش‌فاکتور";
                    break;
                case 4:
                    status  = "پایان اعتبار پلن";
                    break;
                case 5:
                    status = "غیر فعال";
                    break;
                case 6:
                    status = "توسط تیم پشتیبانی بلاک شده است.";
                    change_status = true;
                    break;
                }

                var template = '<tr>' +
                        '<td>'+ 'مشخصات' + '</td>'+
                        '<td>'+ 'مقدار' + '</td>'+
                        '<td>'+ 'دستورات' + '</td>'+
                        '</tr><tr id="row-' + udid + '">' +
                        '<td>'+ 'نام و نام خانوادگی' + '</td>'+
                        '<td>'+ first_name + last_name + '</td>'+
                        '<td>'+
                        '<a target="_blank" href="https://CUSTOMER_PLAN/email_logs?recipient=' + email + '"><button class="hint hint--top log" data-hint="تاریخچهٔ ایمیل‌های ارسالی"><span class="icon-eye"></span></button></a>'+
                        '<button onclick="block_device_switch(\''+udid+'\', true);" class="hint hint--top block" data-hint="بلاک کردن کاربر"><span class="icon-lock"></span></button>'+
                        '<button onclick="block_device_switch(\''+udid+'\', false);" class="appActive hint hint--top display-none" data-hint="فعال کردن کاربر"><span class="icon-key"></span></button>'+
                        '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'پست الکترونیک' + '</td>'+
                        '<td>'+ email + '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'شماره موبایل' + '</td>'+
                        '<td>'+ mobile + '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'کد تخفیف' + '</td>'+
                        '<td>'+ promo_code + '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'تاریخ تمدید' + '</td>'+
                        '<td>'+ pay_time + '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'تاریخ انقضا' + '</td>'+
                        '<td>'+ expire_date + '</td>'+
                        '</tr><tr>' +
                        '<td>'+ 'وضعیت دستگاه' + '</td>'+
                        '<td>'+ status + '</td>'+
                        '</tr>';

                $('#user-data').append(template);

                // Disable lock switch if user has not any credit
                if((change_status == false)){
                    $(".md-content tr#row-" + udid + " button").attr('disabled', true);
                }

                if(f5_status == 6){
                    // Change users table row to show that this user is block and CH
                    // has ability to unblock it.
                    $('#row-' + udid).find('.appActive').removeClass('display-none');
                    $('#row-' + udid).find('.block').addClass('display-none');
                } else if(f5_status == 1) {
                    // Change users table row to normal and give CH ability to block user
                    $('#row-' + udid).find('.appActive').addClass('display-none');
                    $('#row-' + udid).find('.block').removeClass('display-none');
                }
                $('.loading-cnt').addClass('hide');
            } else {
                // If there is a problem in API or there is no related data to user
                // on other databases (it's rare but is possible) show a message to
                // clear everything.
                var template = '<tr class="subtable subtable_body ' + udid + '"">' +
                        '<td colspan="4">'+ 'متاسفانه قادر به دریافت اطلاعات کاربر مورد نظر نیستیم.' + '</td>'+
                        '</tr>';
                $('#user-data').append(template);
                $('.loading-cnt').addClass('hide');
            }
        }, error: function(){
            $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');
        }
    });
}

function generateUserTable(response){
    // Get a response object for a user and generate a table based on it's details.

    // Get the number of installed apps by user. Set it to 0 if response.apps doesn't exist or is undefined.
    var installAppCount = response.apps && null_value_array.indexOf(response.apps) == -1 ? response.apps.length : 0;
    var name = response.name;
    var udid = response.udid;
    var __id = "'"+response._id+"'";
    var qudid = "'"+response.udid+"'"+","+"'"+response.name+"'";

    var template = '<tr id="row-' + udid + '">' + '<td>' +
            name +
            '</td>' +
            '<td>' + udid + '</td>' +
            '<td>' + installAppCount + '</td>' +
            '<td>' +
            '<button onclick="send_UDID('+qudid+');" class="hint hint--top mail" data-hint="ارسال مجدد ایمیل دوم"><span class="icon-mail"></span></button>'+
            '<button onclick="modal_assignUsers_show('+__id+');" class="assignUsers hint hint--top" data-hint="اختصاص کاربر"><span class="icon-user"></span></button>'+
            '</td>' +
            '</tr>';
    // Add table row to the end of #users-list table.
    $('#users-list tr:last').after(template);
}

function getUsersList(page,pagination){
    $.ajax({
        url: '/users/list',
        type:'GET',
        data: {page:page},
        beforeSend: beforeSend(pagination),
        complete: completeAjax(pagination),
        dataType:'json',
        success:function(response){
            if(!pagination){
                // Remove old grid or table
                $('#users-list').find('tr:gt(0)').remove();
            }
            max_users = response.total_count;

            var temp = current_page_user+1;
            if(temp * max_item_list > max_users){
                $('.load-more button').addClass('hide');
            }

            for(var i = 0 ; i<response.users.length ; i++){
                // Generate a table row for every existing user in the response.
                generateUserTable(response.users[i]);
            }
            $('.loading-cnt').addClass('hide');
            fetched_users = true;
            $('[id^="row-"] td').click(function(e){
                if(e.target == this){
                    var udid = $(this).parent().attr('id').slice(4);
                    getUserData(udid);
                }
            });

        }, error: function(response){
            $('.loading-cnt').addClass('hide');
            fetched_users = false;
        }
    });
}

function getGroupsList(page,pagination){
    $.ajax({
        url: '/groups/list',
        type:'GET',
        data: {page:page},
        beforeSend: beforeSend(pagination),
        complete: completeAjax(pagination),
        dataType:'json',
        success:function(response){

            max_groups = response.total_count;

            var temp = current_page_group+1;

            if(temp * max_item_list > max_groups){
                $('.load-more button').add('hide');
            }

            for(var i = 0 ; i<response.groups.length ; i++){

                var __id = "'"+response.groups[i]._id+"'";

                var template = '<div class="col-1-4 group-item"><div class="overlay">'+
                        '<button onclick="modal_editGroup_show('+__id+');" class="setting hint hint--top" data-hint="مدیریت و ویرایش"><span class="icon-settings"></span></button>'+
                        '<input type="hidden" value="'+response.groups[i]._id+'" class="user__id_group" />'+
                        '<input type="hidden" value="'+response.groups[i].username+'" class="user_username_group" />'+
                        '<input type="hidden" value="'+response.groups[i].password+'" class="user_password_group" />'+
                        '<input type="hidden" value="'+response.groups[i].device_count+'" class="user_device_count_group" />'+
                        '<input type="hidden" value="'+response.groups[i].max_devices+'" class="user_max_devices_group" />'+
                        '<input type="hidden" value="'+response.groups[i].order+'" class="user_order_group" />'+
                        '<input type="hidden" value="'+response.groups[i].profile_name+'" class="user_profile_name_group" />'+
                        '<input type="hidden" value="'+response.groups[i].enterprise+'" class="user_enterprise_group" />'+
                        '<input type="hidden" value="'+response.groups[i].devid+'" class="user_devid_group" />'+
                        '</div><div class="">'+
                        '<h3>'+response.groups[i].profile_name+'</h3>'+
                        '</div></div>';

                $('.group-list').append(template);
            }
            $('.loading-cnt').addClass('hide');
            fetched_groups = true;

        }, error: function(response){
            $('.loading-cnt').addClass('hide');
            fetched_groups = false;
        }
    });
}

function deleteApp(id){
    var r = confirm("می‌خواهید این اَپ حذف شود؟");
    if(r == true){
        $.ajax({
            url: '/apps/remove',
            data:{id:id},
            type:'POST',
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType:'json',
            success: function(response){
                if(response.done == true){
                    var appRow = '#app'+id;
                    // Remove all related subtables from DOM
                    while($(appRow).next().hasClass('subtable')){
                        $(appRow).next().remove();
                    }
                    $(appRow).remove();
                    $('.notification.success').find('p').html('اپلیکشن با موفقیت حذف گردید.').parent().removeClass('hide');
                    fadeOutSuccessAlert();
                } else{
                    $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                    fadeOutErrorAlert();
                }
                $('.loading-cnt').addClass('hide');
            },error:function(){
                $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
                $('.loading-cnt').addClass('hide');
            }
        });
    }
}

function deleteCop(lid){
    var r = confirm("آیا می‌خواهید این نسخه حذف شود؟");
    if(r == true){
        $.ajax({
            url: '/apps/cop_remove',
            data:{lid:lid},
            type:'POST',
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType:'json',
            success: function(response){
                if(response.done == true){
                    var copRow = '#cop-'+lid;
                    // If copRow is the last item in cops list, remove cop tables header
                    if($(copRow).prev().hasClass('subtable_head')){
                        $(copRow).prev().remove();
                    }
                    $(copRow).remove();
                    $('.notification.success').find('p').html('نسخهٔ مورد نظر با موفقیت حذف شد.').parent().removeClass('hide');
                    fadeOutSuccessAlert();
                } else{
                    $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                    fadeOutErrorAlert();
                }
                $('.loading-cnt').addClass('hide');
            },error:function(){
                $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
                $('.loading-cnt').addClass('hide');
            }
        });
    }
}

function toggleSubTable(elem){
    // Get an elem object which is a class name. Use it to change span with
    // id=span#elem[without the . at first] variable between +/-. And toggle
    // visibility of element with class .elem.
    var span = $('span#' + elem.slice(1));
    $(span).attr('class', $(span).attr('class') == 'more-details' ? 'less-details' : 'more-details');
    $(elem).toggle('fast');
}

function generateAppsGrid(response){
    var app_id = response._id;
    var app_image = null_value_array.indexOf(response.a60) > -1 ? "/img/noimage.jpg" : response.a512;
    var app_name = response.nam;
    var __id = "'" + app_id + "'";
    var template = '<div class="col-1-4 app-item" style="background:url('+app_image+') no-repeat center center" id="app'+app_id+'">'+
            '<div class="overlay">'+
            '<input type="hidden" value="'+app_id+'" class="user__id_app" />'+
            '<button onclick="deleteApp('+__id+')" class="delete hint hint--top" data-hint="حذف اپلیکیشن"><span class="icon-trash"></span></button>'+
            '</div>'+
            '<div class="appCnt">'+
            '<h3 title="' + app_name + '">' + app_name+'</h3>'+
            '</div>'+
            '</div>';

    $('.apps-list').append(template);
}

function generateAppsTable(response){
    // Use response to generate a table view for applications.
    var app_id = response._id;
    var app_name = response.nam;
    // If app_icon doesn't exist use /img/noimage.jpg other wise use normal image
    var app_icon = null_value_array.indexOf(response.a60) > -1 ? "/img/noimage.jpg" : response.a60;
    var app_version = response.ver;
    var app_size = response.siz;
    var app_description = response.des;
    var app_requirements = response.req;
    // If status is undefined use status = 0
    var app_status = response.status == undefined ? 0 : response.status;
    var app_note = response.note == undefined ? "" : String(response.note).replace(/\r\n|\r|\n/g, '\\n');
    var app_desc = response.locdes == undefined ? "" : String(response.locdes).replace(/\r\n|\r|\n/g, '\\n');
    var app_tags = response.tags == undefined ? "" : String(response.tags).replace(/[,،]/g, ' ');
    var __id = "'" + app_id + "'";
    var dotid = "'." + app_id + "'";
    var template = '<tr id="app' + app_id + '">' +
            '<td>' +
            '<button class="expand-table push-right hint hint--top" onclick="toggleSubTable('+ dotid +
            ')" class="delete hint hint--top" data-hint="جزئیات بیشتر"><span id=' + app_id +
            ' class="more-details"></span></button>' + app_name + '</td>'+
            '<td><img class="tableAppIcon" src="'+ app_icon + '"></td>'+
            '<td>'+ app_version + '</td>'+
            '<td>'+ app_size + '</td>'+
            '<td>'+ '<select id="status-' + app_id +'">' +
            '<option value="0">عادی</option>' +
            '<option value="1">فعال‌، نشانه گذاری شده است.</option>' +
            '<option value="100">غیرفعال‌، نشانه گذاری شده است.</option>' +
            '<option value="101">موقتا از دسترس خارج شده است.</option>' +
            '<option value="102">برای همیشه از دسترس خارج شده است.</option>' +
            '<option value="105">فیلتر موقت.</option>' +
            '</select>' +
            '</td>'+
            '<td>' +
            '<button onclick="deleteApp('+__id+')" class="delete hint hint--top" data-hint="حذف اپلیکیشن"><span class="icon-trash"></span></button>'+
            '<button onclick="displayDesc({desc:\'' + app_desc + "\', tags: \'"+ app_tags + "\', id:" + __id + '})" class="desc hint hint--top" data-hint="توضیحات فارسی اَپ"><span class="icon-bubble"></span></button>'+
            '<button onclick="displayNote({note:\'' + app_note + "\',id:" + __id + '})" class="note hint hint--top" data-hint="یادداشت اپ"><span class="icon-pen"></span></button>'+
            '</tr>' + "<tr class='subtable subtable_head " + app_id +"'>" +
            '<td colspan="3">'+ 'توضیحات مربوط به اَپ' + '</td>'+
            '<td colspan="3">'+ 'نیازمندی‌های نصب' + '</td>'+
            "</tr>" + "<tr class='subtable subtable_body " + app_id +"'>" +
            '<td class="appdescription" colspan="3">' + app_description + '</td>' +
            '<td class="appdescription" colspan="3">' + app_requirements + '</td>' +
            '</tr>';


    // Insert table
    $('#apps-table tr:last').after(template);
    // Set status field
    $("#status-" + app_id).val(app_status);
    $('#status-' + app_id).change(function(){
        change_app_status(app_id, $("#status-" + app_id).val());
    });
}

function change_app_status(app_id, value){
    $.ajax({
        url: '/apps/change_status',
        type:'POST',
        data: {app_id:app_id, value:value},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            if(response.done == true){
                $('.notification.success').find('p').html('وضعیت اپ مورد نظر با موفقیت تغییر کرد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}

function generateCopsTable(response){
    // Use response go generate a subtable row for all cops in an apps document.
    var app_id = response._id;
    var cop = response.cop;
    $.each(cop, function(key, value){
        if(key == 0){
            // Add header first time iterate cops
            var subCop = "<tr class='subtable subtable_head " + app_id +"'>" +
                    '<td colspan="2">'+ 'نسخه‌های دیگر' + '</td>'+
                    '<td>'+ 'نسخه' + '</td>'+
                    '<td>'+ 'حجم' + '</td>'+
                    '<td>' + 'وضعیت' + '</td>'+
                    '<td>' + 'دستورات' + '</td>'+
                    "</tr>";
        }
        // Set status = 0 if there is not any defined status.
        var status = value.status == undefined ? 0 : value.status;
        var note = value.note == undefined ? "" : value.note;
        subCop += '<tr id="cop-' + value.lid + '" class="subtable subtable_body '+ app_id +'">' +
            '<td colspan="2">' + value.lid + '</td>' +
            '<td>' + value.ver + '</td>' +
            '<td>' + value.siz + '</td>' +
            '<td>' + '<select id="status-' + value.lid + '">' +
            '<option value="0">تست نشده‌، فعال است.</option>' +
            '<option value="1">تست شده‌، مشکلی ندارد</option>' +
            '<option value="100">تست نشده‌، غیرفعال است.</option>' +
            '<option value="101">تست شده‌، مشکل دارد.</option>' +
            '</select>' +
            '</td>' +
            '<td>' +
            '<button onclick="deleteCop(\''+value.lid+'\')" class="delete hint hint--top" data-hint="حذف نسخه"><span class="icon-trash"></span></button>' +
            '<button onclick="displayNote({note:\'' + note + "\',lid:'" + value.lid +
            '\'})" class="note hint hint--top" data-hint="یادداشت نسخه"><span class="icon-pen"></span></button>'+
            '</td>' +
            '</tr>';
        // Insert cop to the table
        $('#apps-table tr:last').after(subCop);
        // Set cop status field
        $("#status-" + value.lid).val(status);
        $('#status-' + value.lid).change(function(){
            change_cop_status(value.lid, $("#status-" + value.lid).val());
        });
    });

    // Hide table cops details.
    $(".subtable").hide();
}

function displayNote(args){
    $('#modal-appNote').addClass('md-show');
    if("id" in args){
        var template = "<h3>یادداشت اَپ</h3>" +
                "<textarea id='noteTextArea'>" + args["note"] + "</textarea>" +
                '<div class="one-button-box">' +
                '<button id="saveNote" onclick="setAppNote({ id: \'' + args['id'] + '\'})">ذخیره</button>' +
                "</div>";
    } else if("lid" in args){
        var template = "<h3>یادداشت نسخه</h3>"  +
                "<textarea id='noteTextArea'>" + args["note"] + "</textarea>" +
                '<div class="one-button-box">' +
                '<button id="saveNote" onclick="setAppNote({ lid: \'' + args['lid'] + '\'})">ذخیره</button>' +
                '</div>';
    }
    $("#modal-appNote .md-content").html(template);
}

function displayDesc(args){
    $('#modal-appNote').addClass('md-show');
    var tags = args["tags"] ? args["tags"] : "";
    var template = "<h3>توضیحات فارسی اَپ</h3>" +
            "<textarea id='descTextArea'>" + args["desc"] + "</textarea>" +
            "<div class='tagbox'><label for='descTags'>برچسب‌های اپ</label>" +
            "<input type='text' id='descTags' value='" + tags + "'/></div>" +
            '<div class="one-button-box">' +
            '<button id="saveNote"onclick="setAppDesc({ id: \'' + args['id'] + '\'})">ذخیره</button>' +
            "</div>";
    $("#modal-appNote .md-content").html(template);
}

function setAppDesc(args){
    // Get note from #descTextArea textarea
    var note = $("#descTextArea").val() == undefined ? "" : $("#descTextArea").val();
    var tags = $("#descTags").val() == undefined ? "" : $("#descTags").val();
    var data = {desc: note, tags: tags, id: args['id']};
    var disabled = false;
    if(deactive_apps_mode)
        disabled = true;

    $.ajax({
        url: '/apps/set_app_desc',
        type: 'POST',
        data: data,
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType: 'json',
        success: function(response){
            if(response.done == true){
                displayDesc(data);
                // update app list content and do not lose app list items
                var page_items = (current_page_app + 1) * default_item_per_page;
                getAppsList(0, false, disabled, display_list_view, page_items);
                $('.loading-cnt').addClass('hide');
                $('.notification.success').find('p').html('توضیحات مورد نظر شما با موفقیت ثبت شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else {
                displayDesc(data);
                $('.loading-cnt').addClass('hide');
                $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
        }, error: function(){
            displayDesc(data);
            $('.loading-cnt').addClass('hide');
            $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
        }
    });
}


function setAppNote(args){
    // Get note from #noteTextArea textarea
    var note = $("#noteTextArea").val() == undefined ? "" : $("#noteTextArea").val();
    if("id" in args){
        var data = {note: note, id: args['id']};
    } else if("lid" in args){
        var data = {note: note, lid: args['lid']};
    }
    var disabled = false;
    if(deactive_apps_mode)
        disabled = true;

    $.ajax({
        url: '/apps/set_app_note',
        type: 'POST',
        data: data,
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType: 'json',
        success: function(response){
            if(response.done == true){
                displayNote(data);
                // update app list content and do not lose app list items
                var page_items = (current_page_app + 1) * default_item_per_page;
                getAppsList(0, false, disabled, display_list_view, page_items);
                $('.loading-cnt').addClass('hide');
                $('.notification.success').find('p').html('توضیحات مورد نظر شما با موفقیت ثبت شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else {
                displayNote(data);
                $('.loading-cnt').addClass('hide');
                $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
        }, error: function(){
            displayNote(data);
            $('.loading-cnt').addClass('hide');
            $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
        }
    });
}

function change_cop_status(lid, value){
    $.ajax({
        url: '/apps/change_cop_status',
        type:'POST',
        data: {lid:lid, value:value},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            if(response.done == true){
                $('.notification.success').find('p').html('وضعیت اپ مورد نظر با موفقیت تغییر کرد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('.notification.error').find('p').html('متاسفانه مشکلی در تغییر وضعیت اپ رخ داده، لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}

function getAppsList(page,pagination,disabled,view,count){
    // Generate an apps list based of view type. If it's true we will have a
    // table view other wise there will be a grid view.
    $.ajax({
        url: '/apps/list',
        type:'GET',
        data: {page:page,disabled:disabled,count:count},
        beforeSend: beforeSend(pagination),
        complete: completeAjax(pagination),
        dataType:'json',
        success:function(response){
            // Use the latest used view to show the data.
            display_list_view = view;
            max_apps = response.total_count;
            var temp = current_page_app+1;
            if(temp * max_item_list > max_apps){
                $('.load-more button').addClass('hide');
            }

            if(!pagination){
                // Remove old grid or table
                $('#apps-table').find('tr:gt(0)').remove();
                $('.apps-list').html('');
            }
            for(var i = 0 ; i<response.apps.length ; i++){
                var app_response = response.apps[i];
                var cop = response.apps[i].cop;

                if(view == false){
                    // Hide table head
                    $('#apps-table').hide();
                    // Use grid view
                    generateAppsGrid(app_response);

                } else {
                    // Hide table head
                    $('#apps-table').show();
                    // Use list view

                    generateAppsTable(app_response);
                    // Add cops data
                    if(cop.length > 0){
                        generateCopsTable(app_response);
                    }
                }
            }

            fetched_apps = true;
            $('.loading-cnt').addClass('hide');

        }, error: function(response){
            fetched_apps = false;
            $('.loading-cnt').addClass('hide');
        }
    });
}

function modal_editGroup_show(id){
    last_group_id_editing = id;

    $('#modal-editGroup').addClass('md-show');

    $(".group-item").each(function(){
        var _id = $(this).find('.user__id_group').val();
        if(_id == id){
            var self = $(this);

            $('#modal-editGroup').find('#user_edit_group_devid').val($(self).find('.user_devid_group').val());
            $('#modal-editGroup').find('#user_edit_group_username').val($(self).find('.user_username_group').val());
            $('#modal-editGroup').find('#user_edit_group_password').val($(self).find('.user_password_group').val());
            $('#modal-editGroup').find('#user_edit_group_profile').val($(self).find('.user_profile_name_group').val());
            $('#modal-editGroup').find('#user_edit_group_devcount').val($(self).find('.user_device_count_group').val());
            $('#modal-editGroup').find('#user_edit_group_max_dev').val($(self).find('.user_max_devices_group').val());
            $('#modal-editGroup').find('#user_edit_group_order').val($(self).find('.user_order_group').val());

            if($(self).find('.user_enterprise_group').val()=='true' ||
               $(self).find('.user_enterprise_group').val()==true){
                $('#checkbox2').attr('checked','checked');
            }
            else{
                $('#checkbox2').removeAttr('checked');
            }

        }
    });
}

function modal_assignUsers_show(udid){

    last_user_id_assigning = udid;

    $('#modal-12').addClass('md-show');
    $('body').css('overflow','hidden');

    $.ajax({
        url: '/groups/list',
        type:'GET',
        data: {count:0},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            $('#modal-12').find('tbody').html('');
            for(var i = 0 ; i<response.total_count ; i++){

                var _group_id = "'"+response.groups[i]._id+"'";
                var _user_udid  = "'"+udid+"'";

                $('#modal-12').find('tbody').append('<tr>'+
                                                    '<td>'+response.groups[i].profile_name+'</td>'+
                                                    '<td>'+response.groups[i].devid+'</td>'+
                                                    '<td>'+response.groups[i].device_count+'</td>'+
                                                    '<td><button id="assign'+response.groups[i]._id+'">اختصاص</button></td>'+
                                                    '</tr>');

                $('#assign'+response.groups[i]._id).click(function(event){
                    event.preventDefault();
                    assignUser(event,_group_id,_user_udid);
                });
            }
            $('.loading-cnt').addClass('hide');


        },error: function(){
            $('.loading-cnt').addClass('hide');
        }
    });
}

function setuploadbox(obj){
    var imageType = $(obj).attr('id');
    var parent = $('#' + imageType).parent();
    if (imageType == 'iphone-img1')
        $('#fake-iphone1').val($(obj).val());
    else if (imageType == 'iphone-img2')
        $('#fake-iphone2').val($(obj).val());
    else if (imageType == 'iphone-img3')
        $('#fake-iphone3').val($(obj).val());
    else if (imageType == 'ipad-img')
        $('#fake-ipad').val($(obj).val());
    else if (imageType == 'test-result')
        $('#fake-test-result').val($(obj).val());
    else if (imageType.search('img') === 0)
        $("#fake-" + $(obj).attr('id')).val($(obj).val());
}

function assignUser(event,groupId,userUdid){

    event.preventDefault();

    $.ajax({
        url: '/groups/assign_user',
        type:'POST',
        data: {group_id:groupId,udid:userUdid},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            $('#modal-12').removeClass('md-show');
            $('body').css('overflow','scroll');

            $('.notification.success').find('p').html('کاربر با <span class="tahoma">UDID '+userUdid+'</span> به گروه با آیدی <span class="tahoma">'+groupId+'</span> اختصاص داده شد.').parent().removeClass('hide');
            fadeOutSuccessAlert();
            $('.loading-cnt').addClass('hide');

        },error: function(response){
            $('.notification.error').find('p').html(response.done).parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}

function searchApp(q){
    var disabled = false;

    if(deactive_apps_mode)
        disabled = true;

    $.ajax({
        url: '/apps/list',
        type:'GET',
        data: {q:q,count:12,disabled:disabled},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success: function(response){

            max_apps = response.total_count;

            var temp = current_page_app+1;

            if(temp * max_item_list > max_apps){
                $('.load-more button').addClass('hide');
            } else {
                $('.load-more button').removeClass('hide');
            }

            if(max_apps==0){
                // Remove #apps-table object and show message if there is not any result for the search.
                $('.notification.error').find('p').html('متاسفانه برای جستجوی مورد نظر نتیجه‌ای یافت نشد. :-(.').parent().removeClass('hide');
                fadeOutErrorAlert();
            } else {
                // Remove old table/Grid
                $('#apps-table').find('tr:gt(0)').remove();
                $('.apps-list').html('');

                for(var i = 0 ; i<response.apps.length ; i++){

                    var app_response = response.apps[i];

                    // Check out which display type have to be used.
                    if(display_list_view == false){
                        generateAppsGrid(app_response);
                    } else{
                        generateAppsTable(app_response);
                        generateCopsTable(app_response);
                    }}

            }

            fetched_apps = true;
            $('.loading-cnt').addClass('hide');

        }, error: function(response){
            fetched_apps = false;
            $('.loading-cnt').addClass('hide');

        }

    });

}

function search(q){

    var _url;

    if(users_mode)
        _url = '/users/list';
    else
        _url = '/groups/list';

    $.ajax({
        url: _url,
        type:'GET',
        data: {q:q},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){

            if(response.total_count>12){
                $('.load-more button').removeClass('hide');
            } else{
                $('.load-more button').addClass('hide');
            }

            if(users_mode){
                if(response.total_count==0){
                    $('.notification.error').find('p').html('متاسفانه برای جستجوی مورد نظر نتیجه‌ای یافت نشد. :-(.').parent().removeClass('hide');
                    fadeOutErrorAlert();
                } else {
                    // Remove old rows and insert result rows.
                    $('#users-list').find('tr:gt(0)').remove();
                    for(var i = 0 ; i<response.users.length ; i++){

                        if(response.users[i].apps && response.users[i].apps != 'undefined'){
                            var installAppCount = response.users[i].apps.length;
                        } else{
                            var installAppCount = 0;
                        }

                        generateUserTable(response.users[i]);
                    }
                }
            } else{
                $('.group-list').html('');

                if(response.total_count==0){
                    $('.notification.error').find('p').html('متاسفانه برای جستجوی مورد نظر نتیجه‌ای یافت نشد. :-(.').parent().removeClass('hide');
                    fadeOutErrorAlert();
                }

                for(var i = 0 ; i<response.groups.length ; i++){

                    var __id = "'"+response.groups[i]._id+"'";

                    var template = '<div class="col-1-4 group-item"><div class="overlay">'+
                            '<button onclick="modal_editGroup_show('+__id+');" class="setting hint hint--top" data-hint="مدیریت و ویرایش"><span class="icon-settings"></span></button>'+
                            '<input type="hidden" value="'+response.groups[i]._id+'" class="user__id_group" />'+
                            '<input type="hidden" value="'+response.groups[i].username+'" class="user_username_group" />'+
                            '<input type="hidden" value="'+response.groups[i].password+'" class="user_password_group" />'+
                            '<input type="hidden" value="'+response.groups[i].device_count+'" class="user_device_count_group" />'+
                            '<input type="hidden" value="'+response.groups[i].max_devices+'" class="user_max_devices_group" />'+
                            '<input type="hidden" value="'+response.groups[i].order+'" class="user_order_group" />'+
                            '<input type="hidden" value="'+response.groups[i].profile_name+'" class="user_profile_name_group" />'+
                            '<input type="hidden" value="'+response.groups[i].enterprise+'" class="user_enterprise_group" />'+
                            '<input type="hidden" value="'+response.groups[i].devid+'" class="user_devid_group" />'+
                            '</div><div class="">'+
                            '<h3>'+response.groups[i].profile_name+'</h3>'+
                            '</div></div>';


                    $('.group-list').append(template);
                }
            }
            $('.loading-cnt').addClass('hide');

            // Make search result rows clickable.
            $('[id^="row-"] td').click(function(e){
                if(e.target == this){
                    var udid = $(this).parent().attr('id').slice(4);
                    getUserData(udid);
                }
            });

        }, error: function(response){
            $('.loading-cnt').addClass('hide');

        }
    });

}

function update_axel_change(){
    $.ajax({
        url: '/apps/downloader_log',
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType: 'json',
        success: function(response){
            if(response.done == true){
                var log = response.log;
                var time = response.time;
                var monthDict={Jan: "ژانویه", Feb: "فوریه", Mar: "مارچ", Apr: 'آپریل', May: 'مه', Jun: 'ژوئن',
                               Jul: "جولای", Aug: "آگوست", Sep: "سپتامیر", Oct: "اکتبر", Nov: "توامبر", Dec: "دسامبر"};
                var dayDict={Sun: 'یکشنبه', Mon: 'دوشنبه', Tue: 'سه‌شنبه', Wed: 'چهارشنبه', Thu: "پنج‌شنبه", Fri: "جمعه", Sat: "شنبه"};


                var time_log = "آخرین عملیات در ساعت " + time[3] + " روز " + dayDict[time[0]] + "، " + time[2] + "‌م ماه " + monthDict[time[1]] + " رخ داده است.";
                var status = "<br><a href='" + log[1].substring(0, log[1].length - 4) +"'>لینک فعال در حال دانلود</a> | میزان پیشرفت: " + log[0] ;
                $('#dl-act-res').html(time_log + status);
                $('.loading-cnt').addClass('hide');
            } else {
                $('#dl-act-res').text('متاسفانه قادر به دریافت اطلاعات نیستم. لطفا موضوع را به تیم برنامه نویسی اطلاع دهید.');
                $('.loading-cnt').addClass('hide');
            }
        }, error: function(response){
            $('#dl-act-res').text('متاسفانه قادر به دریافت اطلاعات نیستم. لطفا موضوع را به تیم برنامه نویسی اطلاع دهید.');
            $('.loading-cnt').addClass('hide');
        }
    });
}

function restart_downloader(){
    var r = confirm("آیا می‌خواهید دانلودر را مجددا راه‌اندازی کنید؟");
    if(r == true){
        $.ajax({
            url: '/apps/reset_downloader',
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType: 'json',
            success: function(response){
                if(response.done == true){
                    $("#dl-act-res").text("دستور راه‌اندازی مجدد دانلودر با موفقیت اجرا شد.");
                    $('.loading-cnt').addClass('hide');
                } else {

                    $('#dl-act-res').text('متاسفانه قادر به اجرای دستور راه‌اندازی مجدد دانلودر نیستیم. لطفا موضوع را به تیم برنامه‌نویسی اطلاع دهید.');
                    $('.loading-cnt').addClass('hide');
                }
            }, error: function(response){

                $('#dl-act-res').text('متاسفانه قادر به اجرای دستور راه‌اندازی مجدد دانلودر نیستیم. لطفا موضوع را به تیم برنامه‌نویسی اطلاع دهید.');
                $('.loading-cnt').addClass('hide');
            }
        });
    }
}

$.fn.clearForm = function() {
    return this.each(function() {
        var type = this.type, tag = this.tagName.toLowerCase();
        if (tag == 'form' || tag == 'fieldset')
            return $(':input',this).clearForm();
        if (type == 'text' || type == 'password' || tag == 'textarea')
            this.value = '';
        else if (type == 'checkbox' || type == 'radio')
            this.checked = false;
        else if (tag == 'select')
            this.selectedIndex = -1;
    });
};

function appDownload(){
    // Get a url and add it to download list. Also generate a list of given
    // valid/invalid links to user.
    var url = $("#modal-appDownload .appurl").val();
    $.ajax({
        url: '/apps/add',
        type:'POST',
        data: {url:url},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            if(response.done == true){
                // If response.done is true so remove old imported links:
                $('.appurl').val('');
                $('#valid-download ul').empty();
                $('#invalid-download ul').empty();
                // Add all valid links as a list object to #valid-download object and show it to user.
                if(response.valid_urls.length > 0){
                    $("#valid-download").show();
                    for(var i = 0; i < response.valid_urls.length; i++){
                        var url_li = "<li>" + response.valid_urls[i] + "</li>";
                        $("#valid-download ul").append(url_li);
                    }
                };
                // Add all invalid links as a list object to #invalid-download object and show it to user.
                if(response.invalid_urls.length > 0){
                    $("#invalid-download").show();
                    for(var i = 0; i < response.invalid_urls.length; i++){
                        var url_li = "<li>" + response.invalid_urls[i] + "</li>";
                        $("#invalid-download ul").append(url_li);
                    }
                };
            } else{
                $('.notification.error').find('p').html('خطایی در اضافه کردن اپ مورد نظر شما رخ داده است.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('#modal-appDownload').removeClass('md-show');
            $('.notification.error').find('p').html('خطایی در اضافه کردن اپ مورد نظر شما رخ داده است.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}

function block_device_switch(udid, block){
    // Send udid to block_switch view to toggle device status between
    // Block/Active statuses. Also generate proper message for CH using block
    // boolean varaible.
    $.ajax({
        url: '/users/block_switch',
        type: 'POST',
        data: {udid:udid},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            if(response.success == true){
                // Refresh the page
                getUsersList(0, false);
                // If block button triggred:
                if(block){
                    getUserData(udid);
                    $('.notification.success').find('p').html('کاربر مورد نظر با موفقیت بلاک شد.').parent().removeClass('hide');
                    fadeOutSuccessAlert();
                } else {
                    getUserData(udid);
                    $('.notification.success').find('p').html('کاربر مورد نظر با موفقیت فعال شد.').parent().removeClass('hide');
                    fadeOutSuccessAlert();
                }
            } else{
                getUserData(udid);
                $('.notification.error').find('p').html('مشکلی در تغییر وضعیت کاربر رخ داده لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('.loading-cnt').addClass('hide');
            $('.notification.error').find('p').html('مشکلی در تغییر وضعیت کاربر رخ داده لطفا مجددا تلاش کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
        }
    });
}

function send_UDID(udid,name){
    $.ajax({
        url: '/users/resend_install_email',
        type:'POST',
        data: {udid:udid},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            if(response.done == true){
                $('.notification.success').find('p').html('ایمیل دوم برای کاربر <span class="tahoma">'+name+'</span> با آی دی <span class="tahoma">'+udid+'</span> با موفقیت ارسال شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در ارسال ایمیل دوم اتفاق افتاده است. لطفا مجددا تکرار کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('.notification.error').find('p').html('متاسفانه مشکلی در ارسال ایمیل دوم اتفاق افتاده است. لطفا مجددا تکرار کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}

function send_Email(email,name){
    $.ajax({
        url: '/users/resend_activation_email',
        type:'POST',
        data: {email:email},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){
            $('#modal-firstEmail').removeClass('md-show');
            $('body').css('overflow','scroll');

            if(response.done == true){
                $('.notification.success').find('p').html('ایمیل اول برای کاربر <span class="tahoma">'+name+'</span> با ایمیل <span class="tahoma">'+email+'</span> با موفقیت ارسال شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در ارسال ایمیل اول اتفاق افتاده است. لطفا مجددا تکرار کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
            $('.loading-cnt').addClass('hide');

        },error: function(){
            $('#modal-firstEmail').removeClass('md-show');
            $('body').css('overflow','scroll');
            $('.notification.error').find('p').html('متاسفانه مشکلی در ارسال ایمیل اول اتفاق افتاده است. لطفا مجددا تکرار کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}


function update_screen(){
    $.ajax({
        url: '/appview/current_view',
        type: 'GET',
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType: 'json',
        success: function(response){
            sections = response.view.value.sections;
            $.each(sections, function(i, section){
                generateSection(section);
            });
            $('.loading-cnt').addClass('hide');
            setupSortable();
        },
        error: function(response){
            $('.notification.error').find('p').html('متاسفانه مشکلی در به روز رسانی نمای اپ به وجود آمده است.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');

        }
    });
}


function update_section_lists(type){
    $.ajax({
        url: '/appview/sections',
        type: 'POST',
        data: {type: type},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType: 'json',
        success: function(response){
            if(response.done == true){

                if(type=='banner'){
                    selectBox = '#banner-select select';
                } else if(type=='bundle'){
                    selectBox = '#bundle-select select';
                }else if(type=='applist_horizontal'){
                    selectBox = '#applist-select select';
                }
                // Remove last items from the list
                $(selectBox).html('');

                $.each(response.sections, function(i, item){
                    template = '<option data-object="' + encodeURIComponent(JSON.stringify(item)) +'">' + item.name + '</option>';
                    $(selectBox).append(template);
                });


                $('.loading-cnt').addClass('hide');
                return(response.sections);
            } else {

                $('.notification.error').find('p').html('متاسفانه مشکلی در به روزرسانی لیست بخش‌های موجود به وجود آمده.').parent().removeClass('hide');
                fadeOutErrorAlert();
                $('.loading-cnt').addClass('hide');
            }
        }, error: function(){
            $('.notification.error').find('p').html('متاسفانه مشکلی در به روزرسانی لیست بخش‌های موجود به وجود آمده.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');
        }
    });
}



function createGroup(){

    var _devid = $('#user_add_group_devid').val();
    var _username = $('#user_add_group_username').val();
    var _password = $('#user_add_group_password').val();
    var _device_count = $('#user_add_group_devcount').val();
    var _max_devices = $('#user_add_group_max_dev').val();
    var _profile = $('#user_add_group_profile').val();
    var _order = $('#user_add_group_order').val();
    var _enterprise = $('#checkbox1').attr('checked');

    $.ajax({
        url: '/groups/add',
        type:'POST',
        data: {devid:_devid,username:_username,password:_password,device_count:_device_count,max_devices:_max_devices,profile_name:_profile,order:_order,enterprise:_enterprise},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){


            $('.md-modal').removeClass('md-show');
            $('#groups-access').click();

            if(response.done == true){
                $('.notification.success').find('p').html('گروه شما با موفیت اضافه شد. برای آپدیت شدن لطفا صفحه را رفرش کنید').parent().removeClass('hide');
                fadeOutSuccessAlert();

                var __id = "'"+response.id+"'";

                var template = '<div class="col-1-4 group-item"><div class="overlay">'+
                        '<button onclick="modal_editGroup_show('+__id+');" data-modal="modal-editGroup" class="md-trigger setting hint hint--top" data-hint="مدیریت و ویرایش"><span class="icon-settings"></span></button>'+
                        '<input type="hidden" value="'+response.id+'" class="user_id_group" />'+
                        '</div><div class="">'+
                        '<h3>'+response.id+'</h3>'+
                        '</div></div>';

                $('.group-list').append(template);

                $('.loading-cnt').removeClass('hide');

                for(var i = 0 ; i<=current_page_group ; i++){
                    getGroupsList(i);
                }

                $('.loading-cnt').addClass('hide');
                $("html, body").animate({ scrollTop: $(document).height() }, "slow");
                $('.loading-cnt').addClass('hide');
            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در ایجاد گروه جدید اتفاق افتاده است. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
                $('.loading-cnt').addClass('hide');
            }
        }


    });

}


function editGroup(){

    var _devid = $('#user_edit_group_devid').val();
    var _username = $('#user_edit_group_username').val();
    var _password = $('#user_edit_group_password').val();
    var _device_count = $('#user_edit_group_devcount').val();
    var _max_devices = $('#user_edit_group_max_dev').val();
    var _profile = $('#user_edit_group_profile').val();
    var _order = $('#user_edit_group_order').val();
    var _enterprise = $('#checkbox2').attr('checked');

    $.ajax({
        url: '/groups/edit',
        type:'POST',
        data: {id:last_group_id_editing,devid:_devid,username:_username,password:_password,device_count:_device_count,max_devices:_max_devices,profile_name:_profile,order:_order,enterprise:_enterprise},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success:function(response){

            $('.md-modal').removeClass('md-show');
            $('#groups-access').click();

            if(response.done == true){
                $('.notification.success').find('p').html('گروه شما با موفیت اضافه شد. برای آپدیت شدن لطفا صفحه را رفرش کنید').parent().removeClass('hide');
                fadeOutSuccessAlert();

                $('.loading-cnt').removeClass('hide');

                for(var i = 0 ; i<=current_page_group ; i++){
                    getGroupsList(i);
                }

                $('.loading-cnt').addClass('hide');

            } else{
                $('.notification.error').find('p').html('متاسفانه مشکلی در ایجاد گروه جدید اتفاق افتاده است. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }

            $('.loading-cnt').addClass('hide');
        }


    });

}

function setupSortable(){
    $('.sortableApps').sortable({
        connectWith: '.sortableApps'
    }).bind('sortstart', function(e, ui){
        // Remove hint bubble when dragging (Chrome will show it buggy)
        // It's not the best approach, but It's reliable for now.
        $(ui.item[0]).removeClass('hint');
    }).bind('sortupdate', function(e, ui){
        // Add back hint bubble when everything changed.
        $(ui.item[0]).addClass('hint');
    });
    $('.sortableBanners').sortable({
        connectWith: '.sortableBanners'
    });
    $('.sortableSections').sortable({
        connectWith: '.sortableSections'
    });
}

function appendBundle(data){
    var base_url = location.orgin || null;
    var img1 = data['img1'] ? data['img1'] : data['image']['@1x'];
    var _id = data['_id'];
    var title = data['title'];
    var banner = "<div data-id='" + _id + "' style='background-image: url(" + img1 + ")'></div>";
    $('#banner-box .sortableBanners').append(banner);
    setupSortable();
}

function appendBanner(data){
    var base_url = location.orgin || null;
    var iphone1 = data['iphone1'] ? data['iphone1'] : data['image']['iphone-375w@2x'];
    var _id = data['_id'];
    var alt = data['name'];
    var banner = "<div data-id='" + _id + "' style='background-image: url(" + iphone1 + ")'></div>";
    $('#banner-box .sortableBanners').append(banner);
    setupSortable();
}

function generateSection(data){
    if(data.type == 'banner'){
        template = '<div data-id="' + data._id + '" class="section"><img class="section-close" src="/img/cross.png">';
        $.each(data.items, function(i, item){
            template += "<div  class='banner' style='background-image: url(" + item.image['iphone-375w@2x'] + ")'></div>";
        });
        template += '</div><div class="clear"></div>';
    } else if(data.type == 'bundle'){
        template = '<div data-id="' + data._id + '" class="section"><img class="section-close" src="/img/cross.png">';
        $.each(data.items, function(i, item){
            template += "<div  class='banner' style='background-image: url(" + item.image['@1x'] + ")'></div>";
        });
        template += '</div><div class="clear"></div>';
    } else {
        template = '<div data-id="' + data._id + '" class="section">' +
            "<h4>" + data.name + "</h4><div class='clear'></div><img class='section-close' src='/img/cross.png'>";

        if(data.items){
            $.each(data.items, function(i, item){
                template += "<div class='app' style='background-image: url(" + item.a60 + ")'></div>";
            });
        }
        template += '</div><div class="clear"></div>';
    }

    $('#device-view .screen').append(template);
    $('.section-close').click(function(e){
        $(this).parent().remove();
    });
    setupSortable();
}

function saveAppView(){
    r = confirm('آیا می‌خواهید این نما ذخیره شود؟');
    if(r){
        var screenSections = $('.screen .section');
        var view = {};
        view.key = "featured-page";
        view.value = {};
        view.value.sections = [];
        view.value.sectionCount = screenSections.length;
        $.each(screenSections, function(i, item){
            view.value.sections.push($(item).attr('data-id'));
        });

        $.ajax({
            url: '/appview/save_view',
            type:'POST',
            data: {jsonObject: (JSON.stringify(view))},
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType: 'json',
            success: function(response){
                $('.notification.success').find('p').html('نمای جدید با موفقیت ثبت شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
                $('.loading-cnt').addClass('hide');
            }, error: function(response){
                $('.notification.error').find('p').html('مشکلی در ثبت نما رخ داده. لطفا مشکل را به تیم برنامه نویسی ارجاع دهید.').parent().removeClass('hide');
                fadeOutErrorAlert();
                $('.loading-cnt').addClass('hide');
            }
        });
    }
}

function update_test_folders(){
    $.ajax({
        url: '/apps/test_folders',
        type:'GET',
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success: function(response){
            var dirs = response.dirs;
            for(var i=0; i < dirs.length; i++){
                $('#xl-select').append('<option>' + dirs[i] + '</option>');
            }
            $('.loading-cnt').addClass('hide');
        }, error: function(response){
            $('.notification.error').find('p').html('مشکلی در به روزرسانی پوشه‌های دانلود رخ داده است.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');
        }
    });
}

function download_xl(dir){
    window.location = '/apps/get_test_sheet?dir=' + dir;
}

function processSection(section){
    if(section.children().length > 0){
        var jsonObject = jsonifySection(section);
        saveSection(jsonObject);
        update_section_lists('banner');
        update_section_lists('bundle');
        section.html("");
    } else {
        $('.notification.error').find('p').html('حداقل تعداد آیتم برای ذخیره بخش رعایت نشده است.').parent().removeClass('hide');
        fadeOutErrorAlert();
    }
}

function saveSection(jsonObject){
    $.ajax({
        url: '/appview/save_section',
        type:'POST',
        data: {jsonObject: (JSON.stringify(jsonObject))},
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success: function(response){
            $('.notification.success').find('p').html('بخش جدید با موفقیت ثبت شد.').parent().removeClass('hide');
            fadeOutSuccessAlert();
            $('.loading-cnt').addClass('hide');
        }, error: function(response){
            $('.notification.error').find('p').html('مشکلی در ذخیره بخش رخ داده است. لطفا مشکل را به تیم برنامه نویسی ارجاع دهید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');
        }
    });
}



function appendApp(data){
    for(var i = 0; i < 20; i++){
        if(!data.list[i])
            continue;
        var icon = data.list[i].a60;
        var appid = data.list[i].id;
        var name = data.list[i].nam;
        if(name.length > 50)
            name = name.slice(0, 50) + "...";

        var template = '<div class="hint hint--top app" data-hint="' + name + '" data-appid="' + appid + '" style="background-image: url(' + icon + ')"></div>';
        $('#appbox').append(template);
    }
    setupSortable();
}

function jsonifySection(elem){
    var sectionJson = {};
    var elemChilds = elem.children();
    sectionJson.type = elem.attr('data-sectionType');
    if(sectionJson.type == "applist_horizontal"){
        sectionJson.name = $('#applist-name').val().trim();
        sectionJson.collection = "custom";
        sectionJson.items = [];
        $.each(elemChilds, function(i, item){
            sectionJson.items.push($(item).attr('data-appid'));
        });
    } else {
        sectionJson.name = $('#carousel-name').val().trim();
        sectionJson.items = [];
        $.each(elemChilds, function(i, banner){
            sectionJson.items.push($(banner).attr('data-id'));
        });
    }
    return sectionJson;
}

function listChildren(elem){
    var children = [];
    $(elem).children().each(function(){
        children.push($(this));

    });
    return children;
}

$.fn.serializeObject = function()
// http://stackoverflow.com/questions/1184624/convert-form-data-to-js-object-with-jquery
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function uploadImage(data, type){
    var endpoint;
    if(type==='banner'){
        endpoint = '/apps/upload_banner';
    } else if (type==='bundle'){
        endpoint = '/apps/upload_bundle';
    }
    $.ajax({
        url: endpoint,
        type:'POST',
        data: data,
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        processData: false,
        contentType: false,
        dataType:'json',
        success: function(response){
            $('.loading-cnt').addClass('hide');
            if(response){
                if(type==='banner'){
                    appendBanner(response);
                } else if(type==='bundle'){
                    appendBundle(response);
                }

                // Cleanup banner uploader form
                $('form#banner li input').val('');

                $('.notification.success').find('p').html('ایجاد بنر با موفقیت انجام شد.').parent().removeClass('hide');
                fadeOutSuccessAlert();
            } else {
                $('.notification.error').find('p').html('مشکلی در ثبت بنر رخ داده. لطفا از تکمیل تمامی فیلد‌ها اطمینان حاصل کنید.').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
        }, error: function(response){
            $('.loading-cnt').addClass('hide');
            $('.notification.error').find('p').html('مشکلی در ثبت بنر رخ داده. لطفا از تکمیل تمامی فیلد‌ها اطمینان حاصل کنید.').parent().removeClass('hide');
            fadeOutErrorAlert();
            $('.loading-cnt').addClass('hide');
        }
    });

}
function update_statistics(){
    $.ajax({
        url: '/statistics',
        type:'GET',
        beforeSend: beforeSend(false),
        complete: completeAjax(false),
        dataType:'json',
        success: function(response){
            var template = '<tr>' +
                    '<td>درخواست‌های در انتظار</td>' +
                    '<td>' + response.in_queue + "</td></tr>" +
                    '<td>درخواست ناموفق</td>' +
                    '<td>' + response.errors + "</td></tr>" +
                    '<td>درخواست موفق</td>' +
                    '<td>' + response.compelete + "</td></tr>" +
                    '<td>مجموع درخواست‌ها</td>' +
                    '<td>' + response.all_reqs + "</td></tr>";

            $('#idgen-statistics').find('tr:gt(0)').remove();
            $("#idgen-statistics").append(template);

            $('.loading-cnt').addClass('hide');
        }, error: function(response){
            $('.loading-cnt').addClass('hide');
        }
    });
}

/* ==================================== INITIALIZIATION ===================================== */

$(document).ready(function(){

    // GET FIRST USERS LIST FOR PREVIEW
    getUsersList(current_page_user);
});

/* ======================================= UI EVENTS ======================================== */

$(document).ready(function(){
    $('.load-more button').click(function(){
        if(users_mode){
            current_page_user++;
            getUsersList(current_page_user,true);
        } else if(groups_mode){
            current_page_group++;
            getGroupsList(current_page_group,true);
        } else if(apps_mode){
            current_page_app++;

            var disabled = false;
            if(deactive_apps_mode)
                disabled = true;

            getAppsList(current_page_app,true,disabled, display_list_view, default_item_per_page);
        }
    });

    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() > $(document).height()) {
            if(users_mode){
                current_page_user++;
                getUsersList(current_page_user,true);
            }  else if(groups_mode){
                current_page_group++;
                getGroupsList(current_page_group,true);
            } else if(apps_mode){
                current_page_app++;

                var disabled = false;
                if(deactive_apps_mode)
                    disabled = true;

                getAppsList(current_page_app,true,disabled, display_list_view, default_item_per_page);
            }
        }
    });

    $('#user_srch_app').click(function(){
        var q = $('#user_input_srch_app').val();
        searchApp(q);
    });

    document.getElementById('user_input_srch_app').onkeypress = function(e){
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13'){
            var q = $('#user_input_srch_app').val();
            searchApp(q);
        }
    };

    $('#check-promo').click(function(){
        var promocode = $("#promocode").val();
        $.ajax({
            url: '/promocheck',
            type:'GET',
            data: {promo:promocode},
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType:'json',
            success:function(response){
                if(response.done == true){
                    $('.notification.success').find('p').html('کد تخفیف معتبر است.').parent().removeClass('hide');
                    fadeOutSuccessAlert();
                }else {
                    $('.notification.error').find('p').html('کد تخفیف نامعتبر است').parent().removeClass('hide');
                    fadeOutErrorAlert();
                }
            }, error: function(response){
                $('.notification.error').find('p').html('مشکل در بررسی کد تخفیف').parent().removeClass('hide');
                fadeOutErrorAlert();
            }
        });
        $('.loading-cnt').addClass('hide');
    });

    $('#user_usr_srch').click(function(){
        var q = $('#user_input_srch').val();
        search(q);
    });

    document.getElementById('user_input_srch').onkeypress = function(e){
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13'){
            var q = $('#user_input_srch').val();
            search(q);
        }
    };

    $('.notification img').click(function(){
        $(this).parent().addClass('hide');
    });

    $('#users-section').click(function(){
        apps_mode = false;
        users_mode = true;
        groups_mode = false;
    });

    $('#users-access').click(function(){

        users_mode = true;
        groups_mode = false;

        $('#user_input_srch').attr('placeholder',default_text_search_users);

        $('#users-access').addClass('active-link');
        $('#groups-access').removeClass('active-link');

        $('#users-list').css('display','relative');
        $('#groups-list').css('display','none');

        if(!fetched_users)
            getUsersList(0,false);
    });

    $('#groups-access').click(function(){

        users_mode = false;
        groups_mode = true;

        $('#user_input_srch').attr('placeholder',default_text_search_groups);


        $('#users-access').removeClass('active-link');
        $('#groups-access').addClass('active-link');

        $('#users-list').css('display','none');
        $('#groups-list').css('display','block');

        if(!fetched_groups)
            getGroupsList(0,false);
    });

    $('.md-close').click(function(){
        $('.md-modal').removeClass('md-show');
        $('body').css('overflow','scroll');
    });

    $('#user_add_group_devcount').keypress(function(evt){
        var charCode = (evt.which) ? evt.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57))
            return false;
        return true;
    });

    $('#user_add_group_max_dev').keypress(function(evt){
        var charCode = (evt.which) ? evt.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57))
            return false;
        return true;
    });

    $('.submit-PROJECT').click(function(e){
        e.preventDefault();
        createGroup();
    });

    $('#test-upload').submit(function(e){
        e.preventDefault();
        var formData = new FormData(this);
        $.ajax({
            url: '/apps/upload_test',
            type: 'POST',
            data: formData,
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            processData: false,
            contentType: false,
            dataType:'json',
            success: function(response){
                $('.loading-cnt').addClass('hide');
                $("#failed-test-input ul").empty();
                $("#succeeded-test-input ul").empty();
                if(response.bad_row.length > 0){
                    bad_row = response.bad_row;
                    $('#failed-test-input').show();
                    for(var i=0; i<bad_row.length; i++){
                        var row = "<li>" + bad_row[i] + "</li>";
                        $('#failed-test-input ul').append(row);
                    }
                }
                if(response.fine_row.length > 0){
                    fine_row = response.bad_row;
                    $('#succeeded-test-input').show();
                    for(var i=0; i<fine_row.length; i++){
                        var row = "<li>" + fine_row[i] + "</li>";
                        $('#succeeded-test-input ul').append(row);
                    }
                }
            }, error:function(response){
                $('.loading-cnt').addClass('hide');
            }
        });
    });

    $('.submit-appDownload').click(function(e){
        e.preventDefault();
        appDownload();
    });

    $('.submit-PROJECT-secondMail').click(function(e){
        e.preventDefault();
        udid = $("#user_second_mail_udid").val();
        if(udid)
            send_UDID(udid, '');
    });

    $('#form-firstEmail').submit(function(e){
        e.preventDefault();
        email = $('#user_first_mail_email').val();
        if(email)
            send_Email(email, '');
    });

    $('.submit-edit-PROJECT').click(function(e){
        e.preventDefault();
        editGroup();
    });

    $('#apps-section').click(function(){
        users_mode = false;
        groups_mode = false;
        apps_mode = true;

        getAppsList(0,false,false, display_list_view, default_item_per_page);
    });

    $('#appsTableView').click(function(){
        users_mode = false;
        groups_mode = false;
        apps_mode = true;

        getAppsList(0,false,false, true, default_item_per_page);
    });

    $('#appsGridView').click(function(){
        users_mode = false;
        groups_mode = false;
        apps_mode = true;

        getAppsList(0,false,false,false, default_item_per_page);
    });

    $('#deactive-access').click(function(){
        deactive_apps_mode = true;
        active_apps_mode  = false;

        getAppsList(0,false,true, display_list_view, default_item_per_page);
        $('#active-access').removeClass('active-link');
        $('#deactive-access').addClass('active-link');
    });

    $('#active-access').click(function(){

        deactive_apps_mode = false;
        active_apps_mode  = true;

        getAppsList(0,false,false, display_list_view, default_item_per_page);
        $('#active-access').addClass('active-link');
        $('#deactive-access').removeClass('active-link');
    });

    $('.controll-tab').click(function(){
        $(this).addClass('active-link').siblings().removeClass('active-link');
        var view = $(this).attr('data-viewid');

        $(view).show().siblings().not('.toolbar').hide();

        // update_test_folders();
    });

    $('#xl-download').click(function(){
        var dir = $('#xl-select').val();
        download_xl(dir);
    });
    $('#ipad-device').click(function(){
        $('#ipad-device').hide();
        $('#iphone-device').show();
        $('#right-toolbox').hide('fast');
        $('#left-toolbox').hide('fast');
        $('.marvel-device').removeClass('iphone6');
        $('.marvel-device').addClass('ipad landscape');
    });

    $('#iphone-device').click(function(){
        $('#iphone-device').hide();
        $('#ipad-device').show();
        $('#right-toolbox').show('fast');
        $('#left-toolbox').show('fast');
        $('.marvel-device').removeClass('ipad landscape');
        $('.marvel-device').addClass('iphone6');
    });

    $('#applist-select').submit(function(event){
        event.preventDefault();
        var selected_object = $($('#applist-select select').find('option:selected')).attr('data-object');
        var data_object = JSON.parse(decodeURIComponent(selected_object));
        generateSection(data_object);

    });

    $('#banner-select').submit(function(event){
        event.preventDefault();
        var selected_object = $($('#banner-select select').find('option:selected')).attr('data-object');
        var data_object = JSON.parse(decodeURIComponent(selected_object));
        generateSection(data_object);
    });


    $('#bundle-select').submit(function(event){
        event.preventDefault();
        var selected_object = $($('#bundle-select select').find('option:selected')).attr('data-object');
        var data_object = JSON.parse(decodeURIComponent(selected_object));
        console.log(data_object);
        generateSection(data_object);
    });

    $("#banner").submit(function(event){
        event.preventDefault();
        var formData = new FormData(this);
        uploadImage(formData, 'banner');
    });

    $("#bundle").submit(function(event){
        event.preventDefault();
        var formData = new FormData(this);
        uploadImage(formData, 'bundle');
    });

    $("#applist-sectionform").submit(function(event) {
        event.preventDefault();
        var editableSection = $('#applist-sectionform .section');
        if(editableSection.children().length > 0){
            var jsonObject = jsonifySection(editableSection);
            saveSection(jsonObject);
            update_section_lists('applist_horizontal');
            editableSection.html("");
            // empty forms
            $('#section-generator input').val(' ');
        } else {
            $('.notification.error').find('p').html('حداقل تعداد آیتم برای ذخیره بخش رعایت نشده است.').parent().removeClass('hide');
            fadeOutErrorAlert();
        }
    });

    $("#banner-sectionform").submit(function(event){
        event.preventDefault();
        var editableSection = $('#banner-sectionform .section');
        processSection(editableSection);
    });

    $('#section-3').bind('cssClassChanged', function(){
        if($('#section-3').hasClass('content-current')){
            update_section_lists('banner');
            update_section_lists('bundle');
            update_section_lists('applist_horizontal');
        }
    });

    $('#section-6').bind('cssClassChanged', function(){
        if($('#section-6').hasClass('content-current')){
            update_statistics();
        }
    });

    $('.sub-tool-box #search-button').click(function(){
        var q = $('.toolbox-box #search-box').val();
        var disabled = false;

        $.ajax({
            url: '/apps/find',
            type:'GET',
            data: {q:q,count:20,disabled:disabled},
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType:'json',
            success: function(response){
                $('.loading-cnt').addClass('hide');
                $('#appbox').html('');
                appendApp(response);
            }, error: function(response){
                $('.loading-cnt').addClass('hide');
            }
        });
    });

    $('.sub-tool-box #banner-search-button').click(function(){
        var q = $('.toolbox-box #banner-search-box').val();
        var type = $('#banner-carousel').is(':checked') ? 'banners' : 'bundles';
        var disabled = false;

        $.ajax({
            url: '/appview/banners',
            type:'GET',
            data: {q:q,type:type,count:20,disabled:disabled},
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            dataType:'json',
            success: function(response){
                $('#banner-box .sortableBanners').html('');
                $('.loading-cnt').addClass('hide');
                $.each(response.banners, function(i, banner){
                    if(type==='banners'){
                        appendBanner(banner);
                    } else if(type==='bundles'){
                        appendBundle(banner);
                    }
                });
            }, error: function(response){
                $('.loading-cnt').addClass('hide');
            }
        });
    });

    // $('.section').sortable({
    // 	placeholder: "sectionPlaceHolder",
    // 	connectWith: '.section'
    // });
    $('.tool-box .tab-links li a').click(function(e){
        var currentAttrValue = $(this).attr('href');
        $('.tab-content ' + currentAttrValue).show().siblings().hide();
        $(this).parent('li').addClass('active-tab').siblings().removeClass('active-tab');

        // Ugly! enable sub-toolbox. Change it soon.
        if(currentAttrValue == '#applist-sectionform'){
            $('#app-section').addClass('active').siblings().removeClass('active');
        } else if(currentAttrValue == '#banner-sectionform') {
            $('#banner-box').addClass('active').siblings().removeClass('active');
        }

        e.preventDefault();
    });

    $("#banner-carousel, #bundle-carousel").change(function(){
        if($('#banner-carousel').is(':checked')){
            $("#addBundle").hide();
            $("#addBanner").show();
            $('#bundle-sectionform .section').html('');
            $(".section .sortableBanners").attr("data-sectionType", "banner");
        } else {
            $('#addBundle').show();
            $('#addBanner').hide();
            $('#banner-sectionform .section').html('');
            $(".section.sortableBanners").attr("data-sectionType", "bundle");
        }

        $('#banner-box .sortableBanners').html('');
    });

    function lastClonable(parent){
        return parent.children('.clonable:last');
    }

    function setupRemoveCloned(){
        $(".remove_field").click(function(e){
            e.preventDefault();
            $(this).parent('div').remove();
        });
    }

    $(".addMoreInput").click(function(e){
        e.preventDefault();
        var parent = $(this).parent();
        lastClonable(parent).clone().appendTo(parent);
        if(parent.children('.clonable').length < 3){
            $('<a href="#" onclick("") class="remove_field">X</a></div>').appendTo(lastClonable(parent));
        }
        setupRemoveCloned();
    });

    $("#dirapp-form").submit(function(e){
        e.preventDefault();
        var form = $(this);
        var formData = new FormData(this);
        $.ajax({
            url: '/apps/import',
            type: 'POST',
            data: formData,
            beforeSend: beforeSend(false),
            complete: completeAjax(false),
            processData: false,
            contentType: false,
            dataType:'json',
            success: function(response){
                $('.loading-cnt').addClass('hide');
                $('.notification.success').find('p').html('اپلیکشن با موفقیت بارگزاری شد').parent().removeClass('hide');
                fadeOutSuccessAlert();
                $('#dirapp-form input[type="reset"]').click();
                console.log(form.children());
            }, error:function(response){
                $('.loading-cnt').addClass('hide');
                    $('.notification.error').find('p').html('مشکلی پیش آمده. لطفا مجددا تلاش کنید.').parent().removeClass('hide');
                    fadeOutErrorAlert();

            }
        });

    });

});
