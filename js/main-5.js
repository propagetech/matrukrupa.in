var Viamagus_Form_Loader = {
    isAllEmailAddressAreValid: true,
    _contextPath: '',
    _productQtyInfo: [],
    _init: function() {
        var that = this;
        if ($('.viamagus-custom-form').length) {
            that._loadCustomForms();
            that._initDatePicker();
            that._additionalValidations();
            that._initRatings();
            that._initGoogleMap();
            that._initGoogleDistanceCalculator();
            that._initAddressCountryStateCityLoad();
        }
        that._initPhonePlugin();
        that._initEmailOTPGenerateEvents();
        that._initCombobox();
        this._initPaymentForm();
    },
    _ipInfoResult: null,
    _loadCustomForms: function() {
        var that = this;
        if ($('.viamagus-custom-form').length) {
            $('.viamagus-custom-form').each(function(index, e) {
                var customformId = $(e).attr('id');
                var index = customformId.lastIndexOf('-');
                var formId = customformId.substring(index + 1, customformId.length);
                var url = that._contextPath + '/REST/formbuilder/loadCustomFormMetadata';
                $.ajax({
                    url: url,
                    data: {
                        formId: formId
                    },
                    dataType: 'jsonp',
                    jsonp: 'jsonCallback'
                }).done(function(data) {
                    that._initCustomFormFileUpload(data.result.tenantId);
                    if (data.result) {
                        var formMetaData = data.result;
                        $('#' + customformId).unbind();
                        Viamagus_Form_Loader._validate(customformId, formMetaData);
                        $('#' + customformId).submit(function(event) {
                            event.preventDefault();
                            var validator = $('#' + customformId).validate();
                            if ($('#' + customformId).valid()) {
                                if (data.result.isPaymentRequired == 'Y' && data.result.allowCustomPayment == 'N' && !that._validateProductDetails()) {
                                    return false;
                                }
                                Viamagus_Form_Loader._submitFormAfterValidation(formId, formMetaData);
                            }
                        });
                        if (data.result.isPaymentRequired == 'Y' && data.result.allowCustomPayment == 'N') {
                            if (!$(".vm-currency-container") || $(".vm-currency-container").length == 0) {
                                Viamagus_Currency_Manager.txnCurrency = data.result.baseCurrency;
                            }
                            that._registerProductCalculataionEvent(formId, data.result.baseCurrency);
                        } else {
                            that._loadCustomPaymentCurrencyList();
                        }
                    }
                }).fail(function() {});
            });
        }
    },
    _saveCustomFormValues: function(formId, customFormJSON, formType, formData, crmName, crmEmailId, crmPhoneNo, allowCustomPayment, paymentAmount, customPaymentProductInfo, formPaymentCurrency, crmAddress) {
        var that = this;
        var isPaymentRequired = formData.isPaymentRequired;
        var productJSON = "";
        if (isPaymentRequired == 'Y') {
            productJSON = that._buildProductJSON();
        }
        var html = '<img id="loaderImageForSubmit" width="60px" height="60px"';
        html = html + ' src="/static/sitebuilder/img/loading.gif">'
        $('#viamagus-form-' + formId).find('#Submit').parent().append(html);
        $('#viamagus-form-' + formId).find('#Submit').text('Submitting....');
        $('#viamagus-form-' + formId).find('#loaderImageForSubmit').show();
        var forwardToCustomUrl = formData.forwardToCusotmUrl;
        var that = this;
        var successMsg = formData.ackMsg;
        if (successMsg == null || successMsg == '') {
            successMsg = 'Thank you!';
        }
        var reqOptions = {
            url: that._contextPath + '/REST/formbuilder/saveCustomFormValues',
            data: {
                format: 'json',
                type: 'POST',
                formId: formId,
                formJson: encodeURIComponent(customFormJSON),
                formType: formType,
                productJSON: productJSON,
                websiteUrl: window.location.href,
                isPaymentRequired: isPaymentRequired,
                isCustomPayment: allowCustomPayment,
                paymentAmount: paymentAmount,
                paymentCurrency: formPaymentCurrency
            },
            callback: function(data, formSubmitLogId) {
                // Check if website has opted in for form data capture
                if (window.viamagusFormCapture === true) {
                    var eventData = {
                        formId: formId,
                        formData: JSON.parse(customFormJSON),
                        serverResponse: data,
                        formType: formType,
                        formSubmitLogId: formSubmitLogId
                    };
                    // Emit custom event with form data
                    var event = new CustomEvent('viamagus:formSubmitSuccess', {
                        detail: eventData
                    });
                    window.dispatchEvent(event);
                }

                if (forwardToCustomUrl != "" && forwardToCustomUrl != null) {
                    window.location.href = forwardToCustomUrl;
                } else if (isPaymentRequired == 'Y') {
                    $('#loaderImageForSubmit').remove();
                    $('#viamagus-form-' + formId).find('#Submit').text('Submit');
                    var url = that._contextPath + "/paymentCapture.html";
                    var discountCode = '';
                    var discountAmount = '';
                    var productName = 'Custom Payment';
                    var paymentCurrency = 'INR';
                    if (allowCustomPayment == 'N') {
                        discountCode = JSON.parse(productJSON).discountCode;
                        discountAmount = JSON.parse(productJSON).discountAmount;
                        productName = JSON.parse(productJSON).prodcutName;
                    } else {
                        productName = customPaymentProductInfo;
                    }
                    if (formPaymentCurrency != '') {
                        paymentCurrency = formPaymentCurrency;
                    }
                    that.submitToUrl(url, {
                        isPaymentReqd: "Y",
                        productName: productName,
                        productAmount: paymentAmount,
                        isProductEditable: false,
                        isPriceEditable: false,
                        customerName: crmName,
                        customerEmail: crmEmailId,
                        customerPhoneNo: crmPhoneNo,
                        entityType: 'Form',
                        entityId: formSubmitLogId,
                        discountCode: discountCode,
                        discountAmount: discountAmount,
                        paymentCurrency: paymentCurrency,
                        addressLineOne: crmAddress.addressLineOne,
                        addressLineTwo: crmAddress.addressLineTwo,
                        city: crmAddress.city,
                        state: crmAddress.state,
                        country: crmAddress.country,
                        pincode: crmAddress.pincode
                    });
                } else {
                    $('#loaderImageForSubmit').remove();
                    $('#viamagus-form-' + formId).find('#Submit').text('Submit');
                    if ($('#showAckModal').length != 0) {
                        $('body').remove('#showAckModal');
                    }
                    var modalHtml = '<div class="modal hide fade" id ="showAckModal">';
                    modalHtml = modalHtml + '<div class="modal-header" style="min-height:100px;padding:15px 20px; border:0px;">';
                    modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
                    modalHtml = modalHtml + '<h3 style="padding:25px 20px;font-size:20px;">' + successMsg + '</h3>';
                    modalHtml = modalHtml + '</div>';
                    modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="background-color: #2167FF;color:white;opacity:1;padding: 5px 10px;font-size: 14px;margin:20px;">OK</button>';
                    modalHtml = modalHtml + '</div>';
                    $('body').append(modalHtml);
                    $('#showAckModal').modal('show');
                    Viamagus_Form_Loader._resetFormValues(formData);
                }
            },
            errorCallBack: function() {
                $('#loaderImageForSubmit').remove();
                $('#viamagus-form-' + formId).find('#Submit').text('Submit');
                if ($('#showAckModal').length != 0) {
                    $('body').remove('#showAckModal');
                }
                var modalHtml = '<div class="modal hide fade" id ="showAckModal">';
                modalHtml = modalHtml + '<div class="modal-header" style="min-height:100px;padding:15px 20px; border:0px;">';
                modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
                modalHtml = modalHtml + '<h3 style="padding:25px 20px;font-size:20px;"> Transaction Failed: Please contact support.</h3>';
                modalHtml = modalHtml + '</div>';
                modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="background-color: #2167FF;color:white;opacity:1;padding: 5px 10px;font-size: 14px;margin:20px;">OK</button>';
                modalHtml = modalHtml + '</div>';
                if (!$('#alert-message').length) {
                    $('body').append(modalHtml);
                    $('#showAckModal').modal('show');
                }
            },
            async: false
        };
        new viamagusTransactionManager(reqOptions);
    },
    _initDatePicker: function() {
        var that = this;
        $('.viamagus-date-picker').each(function() {
            var dateobj = $(this).pickmeup({
                position: 'bottom',
                hide_on_select: true,
                view: 'years',
                calendars: 1,
                format: 'd-b-Y',
                minDate: 0,
                change: function(e) {
                    console.log("date changed");
                    $(this).trigger('blur');
                }
            });
        });
        $('.viamagus-date-picker-icon').click(function(e) {
            e.preventDefault();
            var id = $(this).attr("data-date-picker");
            $('#' + id).trigger('click');
        });
    },
    _validate: function(id, formData) {
        var that = this;
        var json = '{';
        var newJson = {};
        var formMetaData = formData.metadataDetailsList;
        for (var i = 0; i < formMetaData.length; i++) {
            var fieldType = formMetaData[i].fieldType;
            var fieldLabel = formMetaData[i].fieldLabel;
            var fieldId = formMetaData[i].fieldId;
            var formType = formMetaData[i].formType;
            var isRequired = formMetaData[i].isRequired;
            var dataValidate = '';
            if ($('#' + fieldId).attr('data-validate')) {
                dataValidate = $('#' + fieldId).attr('data-validate');
            }
            switch (dataValidate) {
                case "number":
                    var addJson = {};
                    addJson[dataValidate] = true;
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                    }
                    newJson["" + fieldId] = addJson;
                    break;
                case "email":
                    var addJson = {};
                    addJson[dataValidate] = true;
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                    }
                    newJson["" + fieldId] = addJson;
                    break;
                case "alpha":
                    var addJson = {};
                    addJson[dataValidate] = true;
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                    }
                    newJson["" + fieldId] = addJson;
                    break;
                case "alphanumeric":
                    var addJson = {};
                    addJson[dataValidate] = true;
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                    }
                    newJson["" + fieldId] = addJson;
                    break;
                case "date":
                    var addJson = {};
                    addJson[dataValidate] = true;
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                    }
                    newJson["" + fieldId] = addJson;
                    break;
                case "text":
                    var addJson = {};
                    if (isRequired == 'Y') {
                        addJson['required'] = true;
                        newJson["" + fieldId] = addJson;
                    }
                    break;
                default:
                    if (isRequired == 'Y') {
                        var addJson = {};
                        addJson['required'] = true;
                        newJson["" + fieldId] = addJson;
                    }
                    break;
            }
        }
        $('#' + id).validate({
            rules: newJson,
            highlight: function(element, errorClass) {
                if ($(element).attr("type") == 'checkbox') {
                    $(element).parent().find('label').css('color', 'red');
                    var id = $(element).parent().find('label').attr('id');
                    var html = $(element).parent().find('label');
                    newhtml = (html).wrap('<div></div>').parent().html();
                    $('#' + id).remove();
                    $(element).parent().parent().append(newhtml);
                } else if ($(element).hasClass("viamagus-combobox")) {
                    var labelId = $(element).parent().find('label').attr('id');
                    var html = $(element).parent().find('label').css('color', 'red');
                    newhtml = (html).wrap('<div></div>').parent().html();
                    $('#' + labelId).remove();
                    $(element).css("border", "1px solid red");
                    $(newhtml).insertAfter($(element).parent());
                } else if ($(element).hasClass("viamagus-date-picker")) {
                    $(element).css("border", "1px solid red");
                    $(element).parent().find('label').css('color', 'red');
                    var id = $(element).parent().find('label').attr('id');
                    var html = $(element).parent().find('label');
                    newhtml = (html).wrap('<div></div>').parent().html();
                    $('#' + id).remove();
                    $(element).parent().parent().append(newhtml);
                } else {
                    $(element).css("border", "1px solid red");
                    $(element).parent().find('label').css('color', 'red');
                }
            },
            unhighlight: function(element, errorClass, validClass) {
                $(element).css("border", "1px solid #ccc");
            }
        });
    },
    _additionalValidations: function() {
        jQuery.validator.addMethod("alphanumeric", function(value, element) {
            return this.optional(element) || /^[a-zA-Z0-9 ]*$/.test(value);
        }, "Please enter alpha numeric characters");
        jQuery.validator.addMethod("alpha", function(value, element) {
            return this.optional(element) || /^[a-zA-Z ]*$/.test(value);
        }, "Please enter only alphabets characters");
        jQuery.validator.addMethod("decimal", function(value, element) {
            return this.optional(element) || /^[0-9]+(\.[0-9])?$/.test(value);
        }, "Please enter only decimal numbers");
    },
    _submitFormAfterValidation: function(formId, formData) {
        var that = this;
        var jsonString = '{ "formJson":  { "customValues": [';
        var isRequired = 'N';
        var isFileUploadRequired = false;
        var isValidPhoneNo = true;
        var isValidEmail = true;
        var isValidSrcDstSelected = true;
        var isValidCheckBox = true;
        var formType = '';
        var formMetaData = formData.metadataDetailsList;
        var crmEmailId = '';
        var crmName = '';
        var crmPhoneNo = '';
        var crmAddress = {
            addressLineOne: '',
            addressLineTwo: '',
            city: '',
            state: '',
            country: '',
            pincode: ''
        };
        var allowCustomPayment = "N";
        var paymentAmount = 0;
        var customPaymentProductInfo = "";
        var paymentCurrency = "INR";
        for (var i = 0; i < formMetaData.length; i++) {
            var fieldType = formMetaData[i].fieldType;
            var fieldLabel = formMetaData[i].fieldLabel;
            var fieldId = formMetaData[i].fieldId;
            var metaDataId = formMetaData[i].metaDataId;
            var isCrmField = formMetaData[i].isCrmField;
            var crmFieldType = formMetaData[i].crmFieldType;
            formType = formMetaData[i].formType;
            var fieldValue = '';
            var ratings = '';
            var isRequired = 'N';
            jsonString = jsonString + '{"fieldType": "' + fieldType + '","fieldLabel": "' + fieldLabel + '",';
            switch (fieldType) {
                case "textinput":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "googleMap":
                    fieldValue = $('#' + fieldId + "_Map_Location").val();
                    break;
                case "address":
                    fieldValue = $('#' + fieldId).val();
                    if (isCrmField == 'Y' && crmFieldType == 'addresslineone') {
                        crmAddress.addressLineOne = fieldValue;
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'addresslinetwo') {
                        crmAddress.addressLineTwo = fieldValue;
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'city') {
                        crmAddress.city = $('#' + fieldId).val();
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'state') {
                        var option = $('#' + fieldId).find("option:selected");
                        crmAddress.state = option.text();
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'country') {
                        var option = $('#' + fieldId).find("option:selected");
                        crmAddress.country = option.text();
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'pincode') {
                        crmAddress.pincode = fieldValue;
                    }
                    break;
                case "email":
                    fieldValue = $('#' + fieldId).val();
                    if (isCrmField == 'Y' && crmFieldType == 'email') {
                        crmEmailId = fieldValue;
                    }
                    if ($('#' + fieldId).attr("data-capture-otp") == "true") {
                        $('#valid-msg-' + fieldId).addClass("hide");
                        var otpField = $('#' + fieldId + '-email-otp');
                        if (otpField.val() == "" || otpField.attr("data-otp-validation-status") == "failed") {
                            $('#' + fieldId + '-email-otp-generate-required').show();
                            isValidEmail = false;
                        } else {
                            $('#' + fieldId + '-email-otp-generate-required').hide();
                            isValidEmail = true;
                        }
                    }
                    break;
                case "name":
                    fieldValue = $('#' + fieldId).val();
                    if (isCrmField == 'Y' && crmFieldType == 'name') {
                        crmName = fieldValue;
                    }
                    break;
                case "phone":
                    fieldValue = $('#' + fieldId).val();
                    if (formMetaData[i].isRequired == 'Y' && (fieldValue != "")) {
                        var phoneNo = $('#' + fieldId).val();
                        var phoneNoObj = $('#' + fieldId);
                        if (phoneNoObj.intlTelInput("isValidNumber")) {
                            $('#valid-msg-' + fieldId).removeClass("hide");
                            $('#error-msg-' + fieldId).addClass("hide");
                            isValidPhoneNo = true;
                        } else {
                            isValidPhoneNo = false;
                            $('#error-msg-' + fieldId).removeClass("hide");
                            $('#valid-msg-' + fieldId).addClass("hide");
                            phoneNoObj.focus();
                        }
                    }
                    if (formMetaData[i].isRequired == 'Y' && (fieldValue == "")) {
                        isValidPhoneNo = false;
                        $('#' + fieldId).focus();
                        $('#error-msg-' + fieldId).removeClass("hide");
                        $('#valid-msg-' + fieldId).addClass("hide");
                    }
                    if (isCrmField == 'Y' && crmFieldType == 'phone') {
                        crmPhoneNo = fieldValue;
                    }
                    if ($('#' + fieldId).attr("data-capture-otp") == "true") {
                        $('#valid-msg-' + fieldId).addClass("hide");
                        var otpField = $('#' + fieldId + '-otp');
                        if (otpField.val() == "" || otpField.attr("data-otp-validation-status") == "failed") {
                            $('#' + fieldId + '-otp-generate-required').show();
                            isValidPhoneNo = false;
                        } else {
                            $('#' + fieldId + '-otp-generate-required').hide();
                            isValidPhoneNo = true;
                        }
                    }
                    break;
                case "passwordinput":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "prependedtext":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "appendedtext":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "textarea":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "date":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "ratings":
                    fieldValue = $('#' + fieldId).attr('data-score');
                    isRequired = formMetaData[i].isRequired;
                    if (fieldValue) {
                        ratings = fieldValue;
                    } else {
                        ratings = 0;
                        fieldValue = 0;
                    }
                    break;
                case "filebutton":
                    fieldValue = $('#' + fieldId).attr('data-file-name');
                    if (formMetaData[i].isRequired == 'Y' && (fieldValue == "" || fieldValue == null)) {
                        isFileUploadRequired = true;
                    };
                    break;
                case "selectbasic":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "selectcombo":
                    fieldValue = $('#' + fieldId).val();
                    break;
                case "googlemap":
                    fieldValue = "https://maps.google.com/?q=" + $('#' + fieldId).attr("data-geo-lat") + "," + $('#' + fieldId).attr("data-geo-lng") + " ";
                    break;
                case "googledistancecalculator":
                    if ($('#' + fieldId + '_Source').attr("data-geo-lat") != "" && $('#' + fieldId + '_Destination').attr("data-geo-lat") != "") {
                        var src = $('#' + fieldId + '_Source').attr("data-geo-lat") + "," + $('#' + fieldId + '_Source').attr("data-geo-lng");
                        var dst = $('#' + fieldId + '_Destination').attr("data-geo-lat") + "," + $('#' + fieldId + '_Destination').attr("data-geo-lng");
                        fieldValue = "https://maps.google.com/maps?saddr=" + src + "&daddr=" + dst;
                    } else {
                        fieldValue = "";
                    }
                    if (typeof($('#' + fieldId + '_Source').attr("required")) != 'undefined') {
                        if (fieldValue == "") {
                            $('#' + fieldId + '_Error_Msg').show();
                            isValidSrcDstSelected = false;
                        } else {
                            $('#' + fieldId + '_Error_Msg').hide();
                            isValidSrcDstSelected = true;
                        }
                    }
                    break;
                case "selectmultiple":
                    var val = '';
                    $('#' + fieldId + ' option:selected').each(function() {
                        val = val + $(this).val();
                        val = val + ",";
                    });
                    if (val.length > 0)
                        fieldValue = val.substr(0, val.length - 1);
                    break;
                case "multipleradios":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        if ($(this).is(":checked")) {
                            val = val + $(this).val();
                            val = val + ",";
                        }
                    });
                    if (val.length > 0)
                        fieldValue = val.substr(0, val.length - 1);
                    break;
                case "multipleradiosinline":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        if ($(this).is(":checked")) {
                            val = val + $(this).val();
                            val = val + ",";
                        }
                    });
                    if (val.length > 0)
                        fieldValue = val.substr(0, val.length - 1);
                    break;
                case "multiplecheckbox":
                    var val = '';
                    var minChkReqd = 0;
                    var maxChkReqd = 0;
                    var totalChk = 0;
                    $('input[name=' + fieldId + ']').each(function() {
                        minChkReqd = $(this).attr("data-min-chk-reqd");
                        maxChkReqd = $(this).attr("data-max-chk-reqd");
                        if ($(this).is(":checked")) {
                            totalChk = totalChk + 1;
                            val = val + $(this).val();
                            val = val + ",";
                        }
                    });
                    if (minChkReqd > 0) {
                        if (totalChk < minChkReqd) {
                            $('#min-chk-error-msg-' + fieldId).show();
                            isValidCheckBox = false;
                            $('input[name=' + fieldId + ']')[0].focus();
                        } else {
                            $('#min-chk-error-msg-' + fieldId).hide();
                        }
                    }
                    if (maxChkReqd > 0) {
                        if (totalChk > maxChkReqd) {
                            $('#max-chk-error-msg-' + fieldId).show();
                            isValidCheckBox = false;
                            $('input[name=' + fieldId + ']')[0].focus();
                        } else {
                            $('#max-chk-error-msg-' + fieldId).hide();
                        }
                    }
                    if (val.length > 0)
                        fieldValue = val.substr(0, val.length - 1);
                    break;
                case "multiplecheckboxinline":
                    var val = '';
                    var minChkReqd = 0;
                    var maxChkReqd = 0;
                    var totalChk = 0;
                    $('input[name=' + fieldId + ']').each(function() {
                        minChkReqd = $(this).attr("data-min-chk-reqd");
                        maxChkReqd = $(this).attr("data-max-chk-reqd");
                        if ($(this).is(":checked")) {
                            totalChk = totalChk + 1;
                            val = val + $(this).val();
                            val = val + ","
                        }
                    });
                    if (minChkReqd > 0) {
                        if (totalChk < minChkReqd) {
                            $('#min-chk-error-msg-' + fieldId).show();
                            isValidCheckBox = false;
                            $('input[name=' + fieldId + ']')[0].focus();
                        } else {
                            $('#min-chk-error-msg-' + fieldId).hide();
                        }
                    }
                    if (maxChkReqd > 0) {
                        if (totalChk > maxChkReqd) {
                            $('#max-chk-error-msg-' + fieldId).show();
                            isValidCheckBox = false;
                            $('input[name=' + fieldId + ']')[0].focus();
                        } else {
                            $('#max-chk-error-msg-' + fieldId).hide();
                        }
                    }
                    if (val.length > 0)
                        fieldValue = val.substr(0, val.length - 1);
                    break;
                case "productList":
                    if (fieldLabel == 'Product Payment Amount') {
                        fieldValue = $('#totalAmountToPay').html() + " INR";
                        if (formData.allowCustomPayment == 'N') {
                            paymentAmount = $('#totalAmountToPay').attr("data-total-amount");
                        }
                    } else {
                        fieldValue = "";
                    }
                    if (Viamagus_Currency_Manager.txnCurrency != '') {
                        if (formData.allowCustomPayment == 'N') {
                            paymentCurrency = Viamagus_Currency_Manager.txnCurrency;
                            paymentAmount = $('#totalAmountToPay').attr("data-total-amount-in-txn-cur");
                        }
                        fieldValue = $('#totalAmountToPay').html() + " " + paymentCurrency;
                    }
                    break;
                case "custompayment":
                    fieldValue = $('#' + fieldId).val() + ' ' + $('#' + fieldId + '-currency option:selected').val();
                    allowCustomPayment = "Y";
                    paymentCurrency = $('#' + fieldId + '-currency option:selected').val();
                    customPaymentProductInfo = $('#' + fieldId).attr("data-product-info");
                    paymentAmount = $('#' + fieldId).val();
                    break;
            }
            jsonString = jsonString + '"fieldValue": "' + fieldValue + '",';
            jsonString = jsonString + '"isCrmField": "' + isCrmField + '",';
            jsonString = jsonString + '"crmFieldType": "' + crmFieldType + '",';
            jsonString = jsonString + '"metaDataId": "' + metaDataId + '"';
            jsonString = jsonString + '}';
            if (i < formMetaData.length - 1) {
                jsonString = jsonString + ',';
            }
        }
        jsonString = jsonString + ']}}';
        if (ratings == 0 && isRequired == 'Y') {
            alert("Rating is required.");
            return;
        }
        if (!isValidPhoneNo || !isValidCheckBox || !isValidSrcDstSelected || !isValidEmail) {
            return;
        }
        if (!that.isAllEmailAddressAreValid) {
            alert("Please enter a valid email Id.");
            return;
        }
        if (isFileUploadRequired) {
            alert("Please choose a file to upload.");
            return;
        }
        if (!that.invokeCustomFormValidation()) {
            return;
        }
        if (formData.isAutoReplyMsgReqd != "" && formData.isAutoReplyMsgReqd != null && formData.isAutoReplyMsgReqd != 'undefined' && formData.isAutoReplyMsgReqd == 'Y') {
            if ($('#showConfirmModal').length > 0) {
                $('#showConfirmModal').remove();
            }
            var modalHtml = '<div class="modal hide fade" id ="showConfirmModal">';
            modalHtml = modalHtml + '<div class="modal-header" style="min-height:100px;padding:15px 20px; border:0px;">';
            modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
            modalHtml = modalHtml + '<h3 style="padding:25px 20px;font-size:20px;">' + formData.autoReplyConfirmatonMessage.replace('{{vm.subscriber_email}}', crmEmailId) + '</h3>';
            modalHtml = modalHtml + '</div>';
            modalHtml = modalHtml + '<div class="pull-right"><button type="button" class="btn btn-primary" data-dismiss="modal" aria-hidden="true" style="background-color: #2167FF;color:white;opacity:1;padding: 5px 10px;font-size: 14px;margin:10px;">Cancel</button>';
            modalHtml = modalHtml + '<button type="button" class="btn btn-success" id="confirm" data-dismiss="modal" aria-hidden="true" style="color:white;opacity:1;padding: 5px 10px;font-size: 14px;margin:10px;">Confirm</button>';
            modalHtml = modalHtml + '</div></div>';
            $('body').append(modalHtml);
            $('#showConfirmModal').modal('show');
            $('#showConfirmModal #confirm').unbind();
            $('#showConfirmModal #confirm').click(function(e) {
                e.preventDefault();
                Viamagus_Form_Loader._saveCustomFormValues(formId, jsonString, formType, formData, crmName, crmEmailId, crmPhoneNo, allowCustomPayment, paymentAmount, customPaymentProductInfo, paymentCurrency, crmAddress);
            });
        } else {
            Viamagus_Form_Loader._saveCustomFormValues(formId, jsonString, formType, formData, crmName, crmEmailId, crmPhoneNo, allowCustomPayment, paymentAmount, customPaymentProductInfo, paymentCurrency, crmAddress);
        }
    },
    _initRatings: function() {
        $('.viamagus-star-rating').each(function() {
            var stars = $(this).attr("data-number");
            $(this).raty({
                number: stars,
                click: function(score, evt) {
                    $(this).attr('data-score', score);
                },
                hints: []
            });
        });
    },
    _initCustomFormFileUpload: function(tenantId) {
        var that = this;
        if ($('.viamagus-file-upload').length) {
            $.ajax({
                type: 'POST',
                url: '/cdnupload/json/initContainerForCustomFormFileUpload.action',
                data: {
                    tenantId: tenantId
                },
                success: function(data) {
                    that.initDropzoneForAjaxFileUpload(data.transactionRefNo);
                }
            });
        }
    },
    initDropzoneForAjaxFileUpload: function(transactionId) {
        $('.viamagus-file-upload').each(function(index, e) {
            var fileuploadId = "#" + $(e).attr("id");
            var myDropzone = new Dropzone(fileuploadId, {
                autoProcessQueue: true,
                paramName: 'upload',
                uploadMultiple: false,
                maxFilesize: 5,
                maxFiles: 1,
                accept: function(file, done) {
                    debugger;
                    $(fileuploadId).attr("data-file-name", transactionId + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, ''));
                    $('#Submit').prop('disabled', true)
                    done();
                },
                complete: function() {
                    $('#Submit').prop('disabled', false);
                },
                url: '/cdnupload/uploadCustomFormUserFile.action?transactionId=' + transactionId,
                thumbnailWidth: "50",
                thumbnailHeight: "50",
                previewsContainer: ".file-preview",
                init: function() {
                    var myDropzone = this;
                    this.on("addedfile", function() {
                        if (this.files[1] != null) {
                            this.removeFile(this.files[0]);
                        }
                    });
                }
            });
        });
    },
    _resetFormValues: function(formData) {
        var formMetaData = formData.metadataDetailsList;
        for (var i = 0; i < formMetaData.length; i++) {
            var fieldType = formMetaData[i].fieldType;
            var fieldLabel = formMetaData[i].fieldLabel;
            var fieldId = formMetaData[i].fieldId;
            var formType = formMetaData[i].formType;
            var ratings = '';
            var isRequired = 'N';
            switch (fieldType) {
                case "name":
                    $('#' + fieldId).val('');
                    break;
                case "email":
                    $('#' + fieldId).val('');
                    if ($('#' + fieldId).attr("data-capture-otp") == "true") {
                        $('#' + fieldId + '-email-otp').val();
                        $('#' + fieldId + '-email-otp-validate-section').hide();
                        $('#' + fieldId + '-email-otp-generate-btn').text("Validate Email Id.");
                        $('#' + fieldId + '-email-otp-generate-btn').show();
                        $('#' + fieldId + '-email-otp-success-msg').hide();
                        $('#' + fieldId + '-email-otp').show();
                        $('#' + fieldId + '-email-otp').val("");
                        $('#' + fieldId).removeAttr("readonly");
                    }
                    break;
                case "phone":
                    $('#' + fieldId).val('');
                    $('#error-msg-' + fieldId).addClass("hide");
                    $('#valid-msg-' + fieldId).addClass("hide");
                    if ($('#' + fieldId).attr("data-capture-otp") == "true") {
                        $('#' + fieldId + '-otp').val();
                        $('#' + fieldId + '-otp-validate-section').hide();
                        $('#' + fieldId + '-otp-generate-btn').text("Validate Phone No.");
                        $('#' + fieldId + '-otp-generate-btn').show();
                        $('#' + fieldId + '-otp-success-msg').hide();
                        $('#' + fieldId + '-otp').show();
                        $('#' + fieldId + '-otp').val("");
                        $('#' + fieldId).removeAttr("readonly");
                    }
                    break;
                case "textinput":
                    $('#' + fieldId).val('');
                    break;
                case "passwordinput":
                    $('#' + fieldId).val('');
                    break;
                case "prependedtext":
                    $('#' + fieldId).val('');
                    break;
                case "appendedtext":
                    $('#' + fieldId).val('');
                    break;
                case "textarea":
                    $('#' + fieldId).val('');
                    break;
                case "googlemap":
                    $('#' + fieldId).attr("data-geo-lat", "");
                    $('#' + fieldId).attr("data-geo-lng", "");
                    break;
                case "date":
                    $('#' + fieldId).val('');
                    break;
                case "ratings":
                    $('#' + fieldId).attr('data-score', 0);
                    break;
                case "selectcombo":
                    $('#' + fieldId).val('');
                    $('.viamagus-combobox').val('');
                    break;
                case "selectbasic":
                    $('#' + fieldId + ' option:first-child').prop('selected', true);
                    break;
                case "selectmultiple":
                    var val = '';
                    $('#' + fieldId + ' option:first-child').prop('selected', true);
                    break;
                case "multipleradios":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        $(this).attr("checked", "");
                        $(this).prop('checked', false);
                    });
                    $('input[name=' + fieldId + ']:first').attr('checked', 'checked');
                    $('input[name=' + fieldId + ']:first').prop('checked', true);
                    break;
                case "multipleradiosinline":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        $(this).attr("checked", "");
                        $(this).prop('checked', false);
                    });
                    $('input[name=' + fieldId + ']:first').attr('checked', 'checked');
                    $('input[name=' + fieldId + ']:first').prop('checked', true);
                    break;
                case "multiplecheckbox":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        $(this).attr("checked", "");
                        $(this).prop('checked', false);
                    });
                    break;
                case "multiplecheckboxinline":
                    var val = '';
                    $('input[name=' + fieldId + ']').each(function() {
                        $(this).attr("checked", "");
                        $(this).prop('checked', false);
                    });
                    break;
                case "filebutton":
                    $('#' + fieldId).attr('data-file-name', '');
                    $('.file-preview').empty();
                    break;
                case "googlemap":
                    $('#' + fieldId).attr("data-geo-lat", "");
                    $('#' + fieldId).attr("data-geo-lng", "");
                    break;
                case "googledistancecalculator":
                    $('#' + fieldId + '_Source').val('');
                    $('#' + fieldId + '_Source').attr("data-geo-lat", "");
                    $('#' + fieldId + '_Source').attr("data-geo-lng", "");
                    $('#' + fieldId + '_Destination').val('');
                    $('#' + fieldId + '_Destination').attr("data-geo-lat", "");
                    $('#' + fieldId + '_Destination').attr("data-geo-lng", "");
                    break;
                case "custompayment":
                    fieldValue = $('#' + fieldId).val('');
                    break;
            }
        }
    },
    _initCombobox: function() {
        if ($('select.viamagus-combobox').length) {
            $('select.viamagus-combobox').combobox();
        }
    },
    _initPhonePlugin: function() {
        var that = this;
        if ($('.viamagus-phone').length) {
            $.getJSON("http://freegeoip.net/json/", function(result) {
                $('.viamagus-phone').intlTelInput({
                    defaultCountry: result.country_code.toLowerCase(),
                    autoPlaceholder: false,
                    utilsScript: "/static/sitebuilder/js/utils.js"
                });
            }).error(function() {
                $('.viamagus-phone').intlTelInput({
                    defaultCountry: 'auto',
                    autoPlaceholder: false,
                    utilsScript: "/static/sitebuilder/js/utils.js"
                });
            });
            that.initPhonePluginValidation();
            that._initOTPGenerateEvents();
        }
    },
    initPhonePluginValidation: function() {
        if ($('.viamagus-phone').length) {
            $('.viamagus-phone').each(function(index, e) {
                var fieldId = $(e).attr("id");
                var phoneNo = $('#' + fieldId).val();
                var phoneNoObj = $('#' + fieldId);
                phoneNoObj.blur(function() {
                    if (phoneNoObj.val() != "") {
                        if (phoneNoObj.intlTelInput("isValidNumber")) {
                            $('#error-msg-' + fieldId).addClass("hide");
                        } else {
                            $('#error-msg-' + fieldId).removeClass("hide");
                        }
                    }
                });
            });
        }
    },
    validEmailUsingMailgun: function(emailIdObj) {
        var that = this;
        if (typeof emailIdObj.mailgun_validator == 'function') {
            emailIdObj.mailgun_validator({
                api_key: 'pubkey-1th5kvhp76ee2mgt3u03nsvfx7k64rp3',
                in_progress: null,
                success: that.showValidEmailMessage,
                error: that.showInValidEmailMessage,
            });
        }
    },
    showValidEmailMessage: function(emailIdObj, data) {
        emailIdObj.css("border", "");
        $('#' + emailIdObj.attr('id') + "-error-api").remove();
        Viamagus_Form_Loader.isAllEmailAddressAreValid = true;
        if (!data['is_valid']) {
            var place = $("<label>").attr("id", emailIdObj.attr('id') + "-error-api").css('color', 'red').html("Email address does not exist.");
            if ($('#' + emailIdObj.attr('id') + "-error-api").length == 0) {
                place.insertAfter(emailIdObj);
            }
            emailIdObj.css("border", "1px solid red");
            Viamagus_Form_Loader.isAllEmailAddressAreValid = false;
        }
    },
    showInValidEmailMessage: function(emailIdObj, data) {
        emailIdObj.css("border", "");
        $('#' + emailIdObj.attr('id') + "-error").remove();
        Viamagus_Form_Loader.isAllEmailAddressAreValid = true;
        if (!data['is_valid']) {
            var place = $("<label>").attr("id", emailIdObj.attr('id') + "-error").css('color', 'red').html("Please enter a valid email address.");
            if ($('#' + emailIdObj.attr('id') + "-error").length == 0) {
                place.insertAfter(emailIdObj);
            }
            emailIdObj.css("border", "1px solid red");
            Viamagus_Form_Loader.isAllEmailAddressAreValid = false;
        }
    },
    _initPaymentForm: function() {
        var that = this;
        this.setPaymentRequestParams();
        this.loadMasterCountryStateCityList();
        if ($('.viamagus-payment-form').length > 0) {
            this._initPhonePlugin();
            $("#paymentForm").validate({
                rules: {
                    productName: "required",
                    customerName: "required",
                    customerPhoneNo: "required",
                    customerEmail: {
                        required: true,
                        email: true
                    },
                    addressLineOne: "required",
                    city: "required",
                    pincode: "required",
                    paymentAmount: "required"
                },
                messages: {
                    productName: "Please enter the product name",
                    customerName: "Please enter your Name",
                    customerPhoneNo: "Please enter your Phone No",
                    customerEmail: "Please enter a valid email address",
                    addressLineOne: "Please enter address Line one",
                    city: "Please enter city",
                    pincode: "Please enter postal code",
                    paymentAmount: "Please enter payment amount."
                }
            });
            that._loadPaymentMode();
            this._loadOrderSummary();
            var callback = function() {
                that._loadPaymentMode();
                that._loadOrderSummary();
            };
            this._loadDirectPaymentCurrencyList(callback);
            $('#paymentForm').unbind('submit');
            $('#paymentForm').submit(function(event) {
                event.preventDefault();
                var validator = $('#paymentForm').validate();
                if ($('#paymentForm').valid()) {
                    that.submitPaymentForm();
                }
            });
            window.onbeforeunload = function() {
                return "Are you sure you want to refresh the page. All the payment related data will be lost.!";
            }
        }
    },
    _loadPaymentMode: function() {
        var that = this;
        var paymentCurrency = 'INR';
        var that = this;
        var url = that._contextPath + '/REST/payment/getPaymentModes';
        $.ajax({
            url: url,
            data: {
                entityType: 'Form',
                entityId: $('#entityId').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result != "") {
                var paymentOption = JSON.parse(data.result);
                if ($('#paymentCurrency').length && $('#paymentCurrency').val() != '') {
                    paymentCurrency = $('#paymentCurrency').find("option:selected").val();
                }
                $('.viamagus-payment-mode-payu').hide();
                for (var i = 0; i < paymentOption.length; i++) {
                    var option = paymentOption[i].paymentMode;
                    var paymentLabel = paymentOption[i].paymentModeLabel;
                    if ($('.viamagus-payment-mode-' + option).length) {
                        $('.viamagus-payment-mode-' + option).show();
                        $("input[name=paymentMode][value=" + option + "]").prop('disabled', false);
                        $("input[name=paymentMode][value=" + option + "]").prop('checked', true);
                        $('.viamagus-payment-mode-' + option + ' .custom-label').html(paymentLabel);
                        if (option == 'paypal' && paymentCurrency == 'INR') {
                            $("input[name=paymentMode][value=" + option + "]").prop('checked', false);
                            $("input[name=paymentMode][value=" + option + "]").prop('disabled', true);
                        }
                        if ((option == 'payu' || option == 'payumoney' || option == 'razorpay') && paymentCurrency != 'INR') {
                            $("input[name=paymentMode][value=" + option + "]").prop('checked', false);
                            $("input[name=paymentMode][value=" + option + "]").prop('disabled', true);
                        }
                    }
                }
            }
        });
        if ($('.viamagus-payment-mode-section').length && $('#entityType').val() == 'Order') {
            that._defaultCustomerInfo();
        }
    },
    setPaymentRequestParams: function() {
        if ($('.viamagus-payment-form').length > 0) {
            if (this.getParameter('entityType') != null) {
                $('#entityType').val(this.getParameter('entityType'));
            }
            if (this.getParameter('paymentAmount') != null) {
                $('#paymentAmount').val(this.getParameter('paymentAmount'));
            }
            if (this.getParameter('productName') != null) {
                $('#productName').val(this.getParameter('productName'));
            }
            if (this.getParameter('isProductEditable') == "false") {
                $('#productName').attr("disabled", "disabled");
            }
            if (this.getParameter('isPriceEditable') == "false") {
                $('#paymentAmount').attr("disabled", "disabled");
            }
        }
        if ($('.viamagus-payment-success').length) {
            $('#txnId').html(this.getParameter('txnId'));
            $('#paymentAmount').html(this.getParameter('paymentAmount'));
            $('#supportEmailId').html(this.getParameter('supportEmailId'));
            $('#productName').html(this.getParameter('productName'));
            if ($('.vm-payment-success-currency-code').length && this.getParameter('paymentCurrency') != '') {
                $('.vm-payment-success-currency-symbol').html('');
                $('.vm-payment-success-currency-code').html(this.getParameter('paymentCurrency'));
            }
            this.initAndroidBridgeOnPayuTransactionOver('success');
            this.loadPaymentSuccessSummary();
        }
        if ($('.viamagus-payment-failure').length) {
            $('#txnId').html(this.getParameter('txnId'));
            $('#supportEmailId').html(this.getParameter('supportEmailId'));
            $('#error').html(this.getParameter('error'));
            this.initAndroidBridgeOnPayuTransactionOver('failed');
        }
        if ($('.viamagus-payment-cancel').length) {
            $('#txnId').html(this.getParameter('txnId'));
            $('#supportEmailId').html(this.getParameter('supportEmailId'));
            $('#error').html(this.getParameter('error'));
            this.initAndroidBridgeOnPayuTransactionOver('failed');
        }
    },
    submitPaymentForm: function() {
        var that = this;
        $('#successUrl').val(location.protocol + "//" + location.host + "/paymentSuccess.html?txnId=");
        $('#cancelUrl').val(location.protocol + "//" + location.host + "/paymentCancel.html?txnId=");
        $('#failureUrl').val(location.protocol + "//" + location.host + "/paymentFailure.html?txnId=");
        $('#paymentSubmit').attr("disabled", "disabled");
        var paymentMode = "payu";
        if ($('.viamagus-payment-mode-section').length) {
            paymentMode = $('input[name="paymentMode"]:checked').val();
        }
        var txnCurrency = '';
        if ($('#paymentCurrency').length) {
            txnCurrency = $('#paymentCurrency').val();
        }
        var productInfoJson = '';
        if (paymentMode == 'payumoney') {
            productInfoJson = productInfoJson + '{"paymentParts":[{';
            productInfoJson = productInfoJson + '"name":"' + $('#productName').val() + '",';
            productInfoJson = productInfoJson + '"description ":"",';
            productInfoJson = productInfoJson + '"value":"' + $('#paymentAmount').val() + '",';
            productInfoJson = productInfoJson + '"isRequired" : "true",';
            productInfoJson = productInfoJson + '"settlementEvent":"EmailConfirmation"';
            productInfoJson = productInfoJson + '}]}';
        };
        var countryCode = "";
        if ($('#country').prop("type") == "select-one") {
            countryCode = $('#country option:selected').attr("data-country-code");
            country = $('#country option:selected').text();
        } else {
            country = $('#country').val();
        }
        var state = "";
        if ($('#state').prop("type") == "select-one") {
            state = $('#state option:selected').attr("data-state-code");
            if (state == "" || state == null || state == "undefined") {
                state = $('#state option:selected').text();
            }
        } else {
            state = $('#state').val();
        }
        var city = $('#city').val();
        var reqOptions = {
            url: that._contextPath + '/REST/payment/savePaymentDetails',
            data: {
                format: 'json',
                type: 'POST',
                paymentAmount: $('#paymentAmount').val(),
                productName: $('#productName').val(),
                customerName: $('#customerName').val(),
                customerEmail: $('#customerEmail').val(),
                customerPhoneNo: $('#customerPhoneNo').val(),
                addressLineOne: $('#addressLineOne').val(),
                addressLineTwo: $('#addressLineTwo').val(),
                state: state,
                city: city,
                country: country,
                countryCode: countryCode,
                pincode: $('#pincode').val(),
                successUrl: $('#successUrl').val(),
                cancelUrl: $('#cancelUrl').val(),
                failureUrl: $('#failureUrl').val(),
                entityId: $('#entityId').val(),
                entityType: $('#entityType').val(),
                callBackProcess: $('#callBackProcess').val(),
                originUrl: document.referrer,
                discountCode: $('#discountCode').val(),
                discountAmount: $('#discountAmount').val(),
                paymentMode: paymentMode,
                productInfoJson: productInfoJson,
                txnCurrency: txnCurrency,
                additionalChargeAmount: $('#additionalChargeAmount').val(),
                additionalChargeName: $('#additionalChargeName').val(),
                additionalChargeMessage: $('#additionalChargeMessage').val(),
                additionalChargeInBaseCur: $("#cartAdditionalChargeAmount").attr("data-additional-Charge-Amount-In-BaseCur")
            },
            callback: function(data, uniqueId) {
                window.onbeforeunload = function() {
                    return;
                }
                if (paymentMode == 'paypal' && data.result.paymentGateway == 'paypal') {
                    that.generatePayPalToken(data, uniqueId, data.result.paymentGateway);
                }
                if (paymentMode == 'payu' && data.result.paymentGateway == 'payu') {
                    that.generateHashCode(data, uniqueId, data.result.paymentGateway);
                }
                if (paymentMode == 'payumoney' && data.result.paymentGateway == 'payumoney') {
                    that.generateHashCode(data, uniqueId, data.result.paymentGateway);
                }
                if (paymentMode == 'razorpay' && data.result.paymentGateway == 'razorpay') {
                    that.loadRazorPay(data, uniqueId, data.result.paymentGateway);
                }
                if (paymentMode == 'COD' || paymentMode == 'Cheque') {
                    that.submitToCODUrl(data, uniqueId, paymentMode);
                }
                window.setTimeout(function() {
                    $('#paymentSubmit').removeAttr("disabled");
                }, 3000);
            },
            errorCallBack: function() {
                $('#paymentSubmit').removeAttr("disabled");
                window.onbeforeunload = function() {
                    return;
                }
            },
            async: false
        };
        new viamagusTransactionManager(reqOptions);
    },
    submitToCODUrl: function(data, uniqueId, paymentMode) {
        this.submitToUrl(data.result.codUrl, {
            txnid: uniqueId,
            amount: $('#paymentAmount').val(),
            productinfo: $('#productName').val(),
            firstname: $('#customerName').val(),
            email: $('#customerEmail').val(),
            phone: $('#customerPhoneNo').val(),
            lastname: "",
            address1: $('#addressLineOne').val(),
            address2: $('#addressLineTwo').val(),
            city: $('#city').val(),
            state: $('#state').val(),
            country: $('#country').val(),
            zipcode: $('#pincode').val(),
            paymentMode: paymentMode
        });
    },
    generatePayPalToken: function(data, uniqueId, paymentGateway) {
        var that = this;
        $.ajax({
            url: that._contextPath + '/REST/payment/getGeneratedHash',
            data: {
                txnId: uniqueId,
                paymentGateway: paymentGateway
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(hashResult) {
            var params = {};
            if (hashResult != null && hashResult.result != "") {
                that.submitToUrl(data.result.paymentGatewayUrl + hashResult.result, params);
            } else {
                alert("Paypal Error.");
            }
        });
    },
    loadRazorPay: function(data, uniqueId, paymentGateway) {
        var that = this;
        var razorPayUrl = "https://checkout.razorpay.com/v1/checkout.js";
        var script = document.createElement("script")
        script.type = "text/javascript";
        if (script.readyState) {
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    that.invokeRazorPay(data, uniqueId, paymentGateway);
                }
            };
        } else {
            script.onload = function() {
                that.invokeRazorPay(data, uniqueId);
            };
        }
        script.src = razorPayUrl;
        document.body.appendChild(script);
    },
    invokeRazorPay: function(data, uniqueId, paymentGateway) {
        var that = this;
        var razorPayOptions = {
            "key": data.result.apiKey,
            "amount": parseFloat($('#paymentAmount').val() * 100),
            "name": data.result.merchantName,
            "description": uniqueId,
            "image": "",
            "handler": function(response) {
                new viamagusLoader('body');
                that.submitToRazorPayHandler(data, uniqueId, paymentGateway, response.razorpay_payment_id);
            },
            "prefill": {
                "name": data.result.customerName,
                "email": data.result.customerEmail,
                "contact": data.result.customerPhoneNo.replace(/ /g, "").replace("+", "")
            },
            "notes": {
                "addressLineOne": data.result.addressLineOne,
                "addressLineTwo": data.result.addressLineTwo,
                "state": data.result.state,
                "city": data.result.city,
                "country": data.result.country,
                "pincode": data.result.pincode,
                "txnId": uniqueId
            },
            "theme": {
                "color": "#F37254"
            }
        };
        new Razorpay(razorPayOptions).open();
    },
    submitToRazorPayHandler: function(data, uniqueId, paymentMode, razorPayId) {
        var that = this;
        this.submitToUrl(data.result.paymentVerficationUrl, {
            txnid: uniqueId,
            amount: $('#paymentAmount').val(),
            razorpayId: razorPayId,
            productinfo: $('#productName').val(),
            firstname: $('#customerName').val(),
            email: $('#customerEmail').val(),
            phone: $('#customerPhoneNo').val(),
            lastname: "",
            address1: $('#addressLineOne').val(),
            address2: $('#addressLineTwo').val(),
            city: $('#city').val(),
            state: $('#state').val(),
            country: $('#country').val(),
            pincode: $('#pincode').val(),
            paymentMode: paymentMode
        });
    },
    generateHashCode: function(data, uniqueId, paymentGateway) {
        var that = this;
        var productInfoJson = '';
        if (paymentGateway == 'payu') {
            productInfoJson = $('#productName').val();
        };
        if (paymentGateway == 'payumoney') {
            productInfoJson = productInfoJson + '{"paymentParts":[{';
            productInfoJson = productInfoJson + '"name":"' + $('#productName').val() + '",';
            productInfoJson = productInfoJson + '"description ":"",';
            productInfoJson = productInfoJson + '"value":"' + $('#paymentAmount').val() + '",';
            productInfoJson = productInfoJson + '"isRequired" : "true",';
            productInfoJson = productInfoJson + '"settlementEvent":"EmailConfirmation"';
            productInfoJson = productInfoJson + '}]}';
        };
        $.ajax({
            url: that._contextPath + '/REST/payment/generateHashForPayuPayment',
            data: {
                txnId: uniqueId,
                paymentAmount: $('#paymentAmount').val(),
                productName: productInfoJson,
                customerName: $('#customerName').val(),
                customerEmail: $('#customerEmail').val(),
                paymentGateway: paymentGateway
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(hashResult) {
            var params = {
                key: data.result.merchantId,
                txnid: uniqueId,
                amount: $('#paymentAmount').val(),
                productinfo: productInfoJson,
                firstname: $('#customerName').val(),
                email: $('#customerEmail').val(),
                phone: $('#customerPhoneNo').val(),
                lastname: "",
                address1: $('#addressLineOne').val(),
                address2: $('#addressLineTwo').val(),
                city: $('#city').val(),
                state: $('#state').val(),
                country: $('#country').val(),
                zipcode: $('#pincode').val(),
                surl: data.result.paymentVerficationUrl,
                curl: data.result.paymentVerficationUrl,
                furl: data.result.paymentVerficationUrl,
                hash: hashResult.result
            };
            if (paymentGateway == 'payumoney') {
                params.service_provider = 'payu_paisa';
            }
            that.submitToUrl(data.result.paymentGatewayUrl, params);
        });
    },
    submitToUrl: function(path, params, method) {
        method = method || "post";
        var form = document.createElement("form");
        form._submit_function_ = form.submit;
        form.setAttribute("method", method);
        form.setAttribute("action", path);
        for (var key in params) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
        document.body.appendChild(form);
        form._submit_function_();
    },
    getParameter: function(paramName) {
        var searchString = window.location.search.substring(1),
            i, val, params = searchString.split("&");
        for (i = 0; i < params.length; i++) {
            val = params[i].split("=");
            if (val[0] == paramName) {
                return unescape(val[1]);
            }
        }
        return null;
    },
    _calculateProductAmount: function(formId, baseCurrency) {
        var that = this;
        var txnCurrency = Viamagus_Currency_Manager.txnCurrency,
            conversionRate = Viamagus_Currency_Manager.conversionRate;
        if ($('.viamagus-form-products').length) {
            var allowMultiple = $('.viamagus-form-products').attr("data-allow-multiple-products");
            var totalAmountToPay = 0;
            var totalAmountToPayInTxnCur = 0;
            var currencyCode = baseCurrency;
            if (txnCurrency && txnCurrency != null) {
                currencyCode = txnCurrency;
            }
            if (baseCurrency != null && baseCurrency != "" && $('.vm-form-product-currency-symbol').length) {
                $('.vm-form-product-currency-symbol').html('');
                $('.vm-form-product-currency-code').html(currencyCode);
            }
            if (allowMultiple == "true") {
                $('.viamagus-allow-multiple-products-purchase').each(function(index, e) {
                    var checkBox = $(e).find("#productCheckBox");
                    var price = $(e).attr("data-product-price");
                    var priceInTxnCur = $(e).attr("data-product-price-in-txn-cur");
                    var qty = $(e).find("#productQty").val();
                    var productSubtotal = 0;
                    var productSubtotalInTxnCur = 0;
                    if (txnCurrency && txnCurrency != null && parseFloat(conversionRate) > 0) {
                        priceInTxnCur = parseFloat(price * conversionRate).toFixed(2);
                        $(e).attr("data-product-price-in-txn-cur", priceInTxnCur);
                        $(e).find(".viamagus-product-price").html($.number(priceInTxnCur, 2));
                    } else {
                        $(e).attr("data-product-price-in-txn-cur", price);
                        $(e).find(".viamagus-product-price").html($.number(price, 2));
                    }
                    that.checkProductAvailability($(e));
                    if (qty > 0) {
                        checkBox.attr("checked", "checked");
                    }
                    if (checkBox.is(":checked") && qty == 0) {
                        $(e).find("#productQty").val(1);
                        qty = 1;
                    }
                    if (checkBox.is(":checked") && qty > 0) {
                        if ($('#discountCode').val() != '') {
                            productSubtotal = that.applyDiscountCode(parseFloat(qty * price), $(e).attr("data-product-name"), formId, $(e), totalAmountToPay, price, qty);
                        } else {
                            productSubtotal = parseFloat(qty * price).toFixed(2);
                            totalAmountToPay = totalAmountToPay + productSubtotal;
                            $(e).attr("data-product-total-amount", productSubtotal);
                            if (txnCurrency && txnCurrency != null && parseFloat(conversionRate) > 0) {
                                productSubtotalInTxnCur = parseFloat(qty * priceInTxnCur).toFixed(2);
                                totalAmountToPayInTxnCur = totalAmountToPayInTxnCur + productSubtotalInTxnCur;
                                $(e).attr("data-product-total-amount-in-txn-cur", productSubtotalInTxnCur);
                                $(e).find(".viamagus-product-subtotal").html($.number(productSubtotalInTxnCur, 2));
                            } else {
                                $(e).attr("data-product-total-amount-in-txn-cur", productSubtotal);
                                $(e).find(".viamagus-product-subtotal").html($.number(productSubtotal, 2));
                            }
                        }
                    } else {
                        $(e).find("#productQty").val(0);
                        $(e).find(".viamagus-product-subtotal").html("0.00");
                        $(e).attr("data-product-total-amount", "0");
                    }
                });
            } else {
                $('.viamagus-allow-single-product-purchase').each(function(index, e) {
                    var radioBtn = $(e).find("#productRadioButton");
                    var price = $(e).attr("data-product-price");
                    var qty = $(e).find("#productQty").val();
                    var priceInTxnCur = $(e).attr("data-product-price-in-txn-cur");
                    var productSubtotal = 0;
                    var productSubtotalInTxnCur = 0;
                    if (txnCurrency && txnCurrency != null && parseFloat(conversionRate) > 0) {
                        priceInTxnCur = parseFloat(price * conversionRate).toFixed(2);
                        $(e).attr("data-product-price-in-txn-cur", priceInTxnCur);
                        $(e).find(".viamagus-product-price").html($.number(priceInTxnCur, 2));
                    } else {
                        $(e).attr("data-product-price-in-txn-cur", price);
                        $(e).find(".viamagus-product-price").html($.number(price, 2));
                    }
                    that.checkProductAvailability($(e));
                    if (radioBtn.is(":checked") && qty == 0) {
                        $(e).find("#productQty").val(1);
                        qty = 1;
                    }
                    if (qty > 0) {
                        radioBtn.attr("checked", "checked");
                    }
                    if (radioBtn.is(":checked") && qty > 0) {
                        if ($('#discountCode').val() != '') {
                            productSubtotal = that.applyDiscountCode(parseFloat(qty * price), $(e).attr("data-product-name"), formId, $(e), totalAmountToPay, price, qty);
                        } else {
                            productSubtotal = parseFloat(qty * price).toFixed(2);
                            totalAmountToPay = totalAmountToPay + productSubtotal;
                            $(e).attr("data-product-total-amount", productSubtotal);
                            if (txnCurrency && txnCurrency != null && parseFloat(conversionRate) > 0) {
                                productSubtotalInTxnCur = parseFloat(qty * priceInTxnCur).toFixed(2);
                                totalAmountToPayInTxnCur = totalAmountToPayInTxnCur + productSubtotalInTxnCur;
                                $(e).attr("data-product-total-amount-in-txn-cur", productSubtotalInTxnCur);
                                $(e).find(".viamagus-product-subtotal").html($.number(productSubtotalInTxnCur, 2));
                            } else {
                                $(e).attr("data-product-total-amount-in-txn-cur", productSubtotal);
                                $(e).find(".viamagus-product-subtotal").html($.number(productSubtotal, 2));
                            }
                        }
                    } else {
                        $(e).find(".viamagus-product-subtotal").html("0.00");
                        $(e).attr("data-product-total-amount", "0");
                    }
                });
            }
            if ($('#discountCode').val() == '') {
                that.calculateTotalAmountToPay();
            }
        }
    },
    applyDiscountCode: function(amountToPay, productName, formId, rowObj, totalAmountToPay, productPrice, qty) {
        var that = this;
        var discountCode = $('#discountCode').val();
        if (discountCode != '') {
            var url = that._contextPath + '/REST/discount/getDiscountValue';
            $.ajax({
                url: url,
                data: {
                    discountCode: discountCode,
                    productName: productName,
                    formId: formId
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result && data.result.isValidDiscount == 'Y') {
                    var discountedPrice = productPrice;
                    if (data.result.discountType == 'percentage') {
                        discountedPrice = discountedPrice - (discountedPrice * data.result.discountValue / 100);
                        amountToPay = discountedPrice * qty;
                        $('.discount-input-section').attr("data-discount-amount", parseFloat($('.discount-input-section').attr("data-discount-amount") != "" ? $('.discount-input-section').attr("data-discount-amount") : 0) + (productPrice - discountedPrice) * qty);
                    }
                    if (data.result.discountType == 'absolute') {
                        discountedPrice = discountedPrice - data.result.discountValue;
                        amountToPay = discountedPrice * qty;
                        $('.discount-input-section').attr("data-discount-amount", parseFloat($('.discount-input-section').attr("data-discount-amount") != "" ? $('.discount-input-section').attr("data-discount-amount") : 0) + (productPrice - discountedPrice) * qty);
                    }
                    $('.vm-discount-success').show();
                    $('.vm-discount-failure').hide();
                    $('#discountCode').attr("readonly", "readonly");
                    $('#removeDiscountCode').show();
                    $('#applyDiscountCode').hide();
                    rowObj.find(".viamagus-product-subtotal").html($.number(amountToPay, 2));
                    rowObj.attr("data-product-total-amount", amountToPay);
                    rowObj.attr("data-discount-price", discountedPrice);
                    rowObj.attr("data-discount-code", $('#discountCode').val());
                    if (amountToPay != parseFloat(productPrice)) {
                        rowObj.find(".viamagus-product-price").html($.number(discountedPrice, 2) + " <strike style='color:red'>(" + $.number(productPrice, 2) + ")</strike>");
                    }
                } else {
                    rowObj.attr("data-product-total-amount", amountToPay);
                    rowObj.find(".viamagus-product-subtotal").html($.number(amountToPay, 2));
                    rowObj.attr("data-discount-price", "");
                    rowObj.attr("data-discount-code", "");
                }
                $('#applyDiscountCode').text('Apply');
                $('#applyDiscountCode').removeAttr('disabled');
                if (amountToPay < 0) {
                    amountToPay = 0;
                }
                that.calculateTotalAmountToPay();
            });
        }
    },
    calculateTotalAmountToPay: function() {
        var allowMultiple = $('.viamagus-form-products').attr("data-allow-multiple-products");
        var totalAmountToPay = 0;
        var totalAmountToPayInTxnCur = 0;
        var isDiscountApplied = false;
        if (allowMultiple == "true") {
            $('.viamagus-allow-multiple-products-purchase').each(function(index, e) {
                var checkBox = $(e).find("#productCheckBox");
                var qty = $(e).find("#productQty").val();
                if (checkBox.is(":checked") && qty > 0) {
                    if ($(e).attr("data-product-total-amount") != "") {
                        totalAmountToPay = totalAmountToPay + parseFloat($(e).attr("data-product-total-amount"));
                    }
                    if ($(e).attr("data-product-total-amount-in-txn-cur") != "") {
                        totalAmountToPayInTxnCur = totalAmountToPayInTxnCur + parseFloat($(e).attr("data-product-total-amount-in-txn-cur"));
                    }
                    if ($(e).attr("data-discount-code") != "") {
                        isDiscountApplied = true;
                    }
                }
            });
        } else {
            $('.viamagus-allow-single-product-purchase').each(function(index, e) {
                var radioBtn = $(e).find("#productRadioButton");
                var qty = $(e).find("#productQty").val();
                if (radioBtn.is(":checked") && qty > 0) {
                    if ($(e).attr("data-product-total-amount") != "") {
                        totalAmountToPay = totalAmountToPay + parseFloat($(e).attr("data-product-total-amount"));
                    }
                    if ($(e).attr("data-product-total-amount-in-txn-cur") != "") {
                        totalAmountToPayInTxnCur = totalAmountToPayInTxnCur + parseFloat($(e).attr("data-product-total-amount-in-txn-cur"));
                    }
                    if ($(e).attr("data-discount-code") != "") {
                        isDiscountApplied = true;
                    }
                }
            });
        }
        $('#totalAmountToPay').attr("data-total-amount", totalAmountToPay.toFixed(2));
        $('#totalAmountToPay').attr("data-total-amount-in-txn-cur", totalAmountToPayInTxnCur.toFixed(2));
        if (totalAmountToPayInTxnCur > 0) {
            $('#totalAmountToPay').html($.number(totalAmountToPayInTxnCur, 2));
        } else {
            $('#totalAmountToPay').html($.number(totalAmountToPay, 2));
        }
        if ($('#discountCode').val() != '') {
            if (!isDiscountApplied) {
                $('#removeDiscountCode').hide();
                $('#applyDiscountCode').show();
                $('.vm-discount-success').hide();
                $('.vm-discount-failure').show();
            }
        }
    },
    _validateProductDetails: function() {
        var isProductSelected = false;
        if ($('.viamagus-form-products').length) {
            var allowMultiple = $('.viamagus-form-products').attr("data-allow-multiple-products");
            var totalAmountToPay = 0;
            if (allowMultiple == "true") {
                $('.viamagus-allow-multiple-products-purchase').each(function(index, e) {
                    var checkBox = $(e).find("#productCheckBox");
                    var qty = $(e).find("#productQty").val();
                    if (checkBox.is(":checked") && qty > 0) {
                        isProductSelected = true;
                    }
                });
            } else {
                $('.viamagus-allow-single-product-purchase').each(function(index, e) {
                    var radioBtn = $(e).find("#productRadioButton");
                    var qty = $(e).find("#productQty").val();
                    if (radioBtn.is(":checked") && qty > 0) {
                        isProductSelected = true;
                    }
                });
            }
            if (!isProductSelected) {
                $('.product-error-selection-required').show();
            } else {
                $('.product-error-selection-required').hide();
            }
            if ($('#totalAmountToPay').html() != "" && !parseFloat($('#totalAmountToPay').html()) > 0) {
                $('.product-error-amount-zero').show();
            } else {
                $('.product-error-amount-zero').hide();
            }
            return isProductSelected;
        }
        return true;
    },
    _registerProductCalculataionEvent: function(formId, baseCurrency) {
        $('.viamagus-product-qty').unbind();
        var that = this;
        that._calculateProductAmount(formId, baseCurrency);
        that._loadFormProductQtyInfo(formId, baseCurrency)
        $('.viamagus-product-qty').change(function(e) {
            $(this).val(Math.abs($(this).val()));
            var minQty = $(this).attr("data-min-order-qty");
            var maxQty = $(this).attr("data-max-order-qty");
            if (minQty != null && minQty != "" && parseInt(minQty) > 0) {
                if ($(this).val() < parseInt(minQty)) {
                    $(this).val(parseInt(minQty));
                }
            }
            if (maxQty != null && maxQty != "" && parseInt(maxQty) > 0) {
                if ($(this).val() > parseInt(maxQty)) {
                    $(this).val(parseInt(maxQty));
                }
            }
            that._calculateProductAmount(formId, baseCurrency);
        });
        $('.viamagus-product-select').change(function(e) {
            $('#discountCode').val('');
            $('#discountCode').removeAttr("readonly");
            $('#removeDiscountCode').hide();
            $('#applyDiscountCode').show();
            $('.vm-discount-success').hide();
            $('.vm-discount-failure').hide();
            that._calculateProductAmount(formId, baseCurrency);
        });
        $('.viamagus-discount-checkbox').change(function(e) {
            $('#removeDiscountCode').hide();
            $('#applyDiscountCode').show();
            if ($(this).is(':checked')) {
                $('.discount-input-section').show();
            } else {
                $('.discount-input-section').hide();
                $('#discountCode').val('');
                $('#discountCode').removeAttr("readonly");
            }
            that._calculateProductAmount(formId, baseCurrency);
        });
        $('#applyDiscountCode').click(function(e) {
            if ($('#discountCode').val() != '') {
                $(this).text('Applying...');
                $(this).attr('disabled', 'disabled');
                that._calculateProductAmount(formId, baseCurrency);
            }
        });
        $('#removeDiscountCode').click(function(e) {
            $('#discountCode').val('');
            $('#discountCode').removeAttr('readonly');
            $('#applyDiscountCode').show();
            $(this).hide();
            that._calculateProductAmount(formId, baseCurrency);
            $('.vm-discount-success').hide();
        });
    },
    _buildProductJSON: function() {
        var productJSON = "";
        var prodcutName = "";
        if ($('.viamagus-form-products').length) {
            productJSON = '{"products":[';
            var allowMultiple = $('.viamagus-form-products').attr("data-allow-multiple-products");
            var totalAmountToPay = 0;
            if (allowMultiple == "true") {
                $('.viamagus-allow-multiple-products-purchase').each(function(index, e) {
                    var checkBox = $(e).find("#productCheckBox");
                    var qty = $(e).find("#productQty").val();
                    if (checkBox.is(":checked") && qty > 0) {
                        prodcutName = prodcutName + $(e).attr("data-product-name") + ", ";
                        productJSON = productJSON + '{"productName":"' + $(e).attr("data-product-name") + '","productPrice":"' + $(e).attr("data-product-price") + '","productPriceInTxnCur":"' + $(e).attr("data-product-price-in-txn-cur") + '","productQty":' + qty + ',"discountPrice":"' + $(e).attr("data-discount-price") + '","productAmount":"' + $(e).attr("data-product-total-amount") + '","productAmountInTxnCur":"' + $(e).attr("data-product-total-amount-in-txn-cur") + '","discountCode":"' + $(e).attr("data-discount-code") + '"},';
                    }
                });
                prodcutName = prodcutName.substring(0, prodcutName.length - 2);
                productJSON = productJSON.substring(0, productJSON.length - 1);
            } else {
                $('.viamagus-allow-single-product-purchase').each(function(index, e) {
                    var radioBtn = $(e).find("#productRadioButton");
                    var qty = $(e).find("#productQty").val();
                    if (radioBtn.is(":checked") && qty > 0) {
                        prodcutName = prodcutName + $(e).attr("data-product-name");
                        productJSON = productJSON + '{"productName":"' + $(e).attr("data-product-name") + '","productPrice":"' + $(e).attr("data-product-price") + '","productPriceInTxnCur":"' + $(e).attr("data-product-price-in-txn-cur") + '","productQty":' + qty + ',"discountPrice":"' + $(e).attr("data-discount-price") + '","productAmount":"' + $(e).attr("data-product-total-amount") + '","productAmountInTxnCur":"' + $(e).attr("data-product-total-amount-in-txn-cur") + '","discountCode":"' + $(e).attr("data-discount-code") + '"}';
                    }
                });
            }
            productJSON = productJSON + '],"totalAmountToPay":"' + $('#totalAmountToPay').attr("data-total-amount") + '","totalAmountToPayInTxnCur":"' + $('#totalAmountToPay').attr("data-total-amount-in-txn-cur") + '","discountCode":"' + $('#discountCode').val() + '","prodcutName":"' + prodcutName + '",';
            productJSON = productJSON + '"discountAmount":"' + $('.discount-input-section').attr('data-discount-amount') + '"}';
        }
        return productJSON;
    },
    _loadOrderSummary: function() {
        var that = this;
        if ($('#entityType').val() == 'Form') {
            /*that.loadFormOrderSummary();*/
            that.loadFormOrderSummary();
            window.setTimeout(function() {
                that.loadFormOrderSummary();
            }, 1500);
        }
        if ($('#entityType').val() == 'Order') {
            that.loadCartSummary();
        }
    },
    loadFormOrderSummary: function() {
        var that = this;
        var url = that._contextPath + '/REST/payment/loadFormOrderSummary';
        $.ajax({
            url: url,
            data: {
                entityType: 'Form',
                entityId: $('#entityId').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result.length) {
                $('.viamagus-checkout-summary').show();
                $('.viamagus-product-info').hide();
                $('#viamagus-order-summary-body').empty();
                for (var i = 0; i < data.result.length; i++) {
                    var product = data.result[i];
                    var currencySymbol = ' ';
                    var currencyCode = product.baseCurrency;
                    if (product.isCustomPayment == 'N') {
                        that.initOnPaymentModeChangeEvent();
                        var productPrice = product.productPrice;
                        var productAmount = product.paymentAmount;
                        if (product.hasOwnProperty('txnCurrency') && product.txnCurrency != '' && product.txnCurrency != product.baseCurrency) {
                            currencySymbol = '';
                            currencyCode = product.txnCurrency;
                            productPrice = product.productPriceInTxnCur;
                            productAmount = product.productAmtInTxnCur;
                        }
                        if ($('.vm-form-payment-currency-code').length) {
                            $('.vm-form-payment-currency-symbol').html('');
                            $('.vm-form-payment-currency-code').html(currencyCode);
                        }
                        $('.viamagus-form-product-summary').show();
                        var productRow = '<tr class="viamagus-product-summary-row" > ';
                        productRow = productRow + '<td data-title="Product Name">' + product.productName + '</td>';
                        if (product.discountAmount != null && product.discountAmount != "") {
                            productRow = productRow + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="vm-format-number">' + product.discountAmount + '</span> <strike style="color:red;">(<span class="vm-format-number">' + productPrice + '</span>) ' + currencyCode + '</strike></td>';
                        } else {
                            productRow = productRow + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="vm-format-number">' + productPrice + '</span> ' + currencyCode + '</td>';
                        }
                        productRow = productRow + '<td class="numeric" data-title="Quantity">' + product.productQty + '</td>';
                        productRow = productRow + '<td class="numeric sub-total"><b>' + currencySymbol + '<span class="vm-format-number row-subtotal">' + productAmount + '</span> ' + currencyCode + '</b></td> <tr>';
                        $('#viamagus-order-summary-body').append(productRow);
                        $('#checkOutSummaryTotalNumber').html(data.result[0].totalAmount);
                        if (data.result[0].discountCode != "") {
                            $('#checkOutSummaryDiscountRow').show();
                            $('#checkOutDiscountCode').html(data.result[0].discountCode);
                        }
                    } else {
                        $('.viamagus-custom-payment-summary').show();
                        $('.vm-form-submit-ref-id').html(product.txnId);
                        if ($('.vm-form-custom-payment-currency-code').length) {
                            if ($('#paymentCurrency').val() != '') {
                                $('.vm-form-custom-payment-currency-symbol').html('');
                                $('.vm-form-custom-payment-currency-code').html($('#paymentCurrency').val());
                            }
                        }
                        $('.vm-form-custom-payment-amount').html(product.totalAmount);
                    }
                }
                $('.vm-format-number').number(true, 2);
            }
        });
    },
    loadCartSummary: function() {
        var that = this;
        var url = that._contextPath + '/REST/ecommerce/loadShoppingCartSummary';
        $.ajax({
            url: url,
            data: {
                entityType: 'Order',
                entityId: $('#entityId').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result.length) {
                that.initOnPaymentModeEcommChangeEvent();
                $('#viamagus-shopping-cart-table-content').empty();
                $('.viamagus-product-info').hide();
                var currencySymbol = 'Rs. ';
                var currencyCode = '';
                for (var i = 0; i < data.result.length; i++) {
                    var productPrice = data.result[i].productPrice;
                    var productAmount = data.result[i].productAmount;
                    var totalAmount = data.result[i].totalAmount;
                    var discountAmount = data.result[i].discountAmount;
                    if (data.result[i].hasOwnProperty('storeCurrency') && data.result[i].storeCurrency != "" && data.result[i].storeCurrency != null) {
                        currencySymbol = '';
                        currencyCode = data.result[i].storeCurrency;
                    }
                    if (data.result[i].hasOwnProperty('transactionCurrency') && data.result[i].transactionCurrency != "" && data.result[i].transactionCurrency != null) {
                        currencySymbol = '';
                        currencyCode = data.result[i].transactionCurrency;
                        productPrice = data.result[i].priceInTransactCurrency;
                        productAmount = data.result[i].productAmountInTransactionCurrency;
                        totalAmount = data.result[i].totalAmountInTransactionCurrency;
                        discountAmount = data.result[i].discountAmountInTransactCurrency;
                    }
                    var cartItemHtml = '<tr class="viamagus-cart-item-row data-product-id="' + data.result[i].productId + '">';
                    cartItemHtml = cartItemHtml + '<td data-title="Product Name">' + data.result[i].productName + '</td>';
                    cartItemHtml = cartItemHtml + '<td><a class="viamagus-image-lightbox" href="#"><img class="viamagus-product-image-url" style="width:50px;height:auto;" src="' + data.result[i].productImageUrl + '"></a></td>';
                    cartItemHtml = cartItemHtml + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="viamagus-product-price viamagus-format-number">';
                    cartItemHtml = cartItemHtml + ' ' + productPrice + '</span> ' + currencyCode;
                    if (data.result[i].hasOwnProperty('weightUnit') && data.result[i].weightUnit != null) {
                        cartItemHtml = cartItemHtml + '/' + data.result[i].weightUnit + '</td>';
                    }
                    cartItemHtml = cartItemHtml + '<td class="numeric" data-title="Quantity">' + data.result[i].productQty + '</td>';
                    cartItemHtml = cartItemHtml + '<td class="numeric sub-total" ><b>' + currencySymbol + '<span class="viamagus-product-subtotal row-subtotal viamagus-format-number">' + productAmount + '</span> ' + currencyCode + ' </b></td>';
                    cartItemHtml = cartItemHtml + '</tr>';
                    $('#viamagus-shopping-cart-table-content').append(cartItemHtml);
                    $('#shoppingCartTotal').html(totalAmount);
                    $('#paymentAmount').attr("data-payment-amount", totalAmount);
                    $('.vm-currency-symbol').html(currencySymbol);
                    $('.vm-currency-code').html(currencyCode);
                    if ($('#discountCode').val() != "" && $('#discountCode').val() != null && $('#orderSummaryDiscountRow').length) {
                        $('#orderSummaryDiscountRow').show();
                        $('#cartDiscountCode').html($('#discountCode').val());
                        $('#cartDiscountAmount').html(discountAmount);
                    }
                }
            }
            $('.viamagus-format-number').number(true, 2);
        });
    },
    loadFormPaymentModes: function() {
        var that = this;
        var url = that._contextPath + '/REST/payment/getPaymentModes';
        $.ajax({
            url: url,
            data: {
                entityType: 'Form',
                entityId: $('#entityId').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result) {
                var paymentOption = data.result.split(",");
                $('.viamagus-payment-mode-payu').hide();
                for (var i = 0; i < paymentOption.length; i++) {
                    var paymentMode = paymentOption[i];
                    if ($('.viamagus-payment-mode-' + option.toLowerCase()).length) {
                        $('.viamagus-payment-mode-' + option.toLowerCase()).show();
                    }
                }
                if (data.result.indexOf(",") == -1) {
                    $("input[name=paymentMode][value=" + paymentOption + "]").prop('checked', true);
                }
            }
        });
    },
    loadCartPaymentModes: function() {
        var that = this;
        var url = that._contextPath + '/REST/ecommerce/getPaymentModes';
        $.ajax({
            url: url,
            data: {
                entityType: 'Order',
                entityId: $('#entityId').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result != "") {
                var paymentOption = JSON.parse(data.result);
                $('.viamagus-payment-mode-payu').hide();
                for (var i = 0; i < paymentOption.length; i++) {
                    var option = paymentOption[i].paymentMode;
                    if ($('.viamagus-payment-mode-' + option).length) {
                        $('.viamagus-payment-mode-' + option).show();
                    }
                }
            }
        });
    },
    loadPaymentSuccessSummary: function() {
        var that = this;
        var entitytype = that.getParameter('entityType');
        var entityId = that.getParameter('entityId');
        if (entitytype == 'Order' && entityId != '') {
            that.loadOrderPaymentSuccessSummary(entitytype, entityId);
        }
        if (entitytype == 'Form' && entityId != '') {
            that.loadFormProductPaymentSuccessSummary(entitytype, entityId);
        }
    },
    loadOrderPaymentSuccessSummary: function(entitytype, entityId) {
        var that = this;
        var url = that._contextPath + '/REST/ecommerce/loadShoppingCartSummary';
        $.ajax({
            url: url,
            data: {
                entityType: entitytype,
                entityId: entityId
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result.length) {
                $('#order-summary-header').empty();
                $('#order-summary-body').empty();
                $('#order-summary-header').append('<tr><th>ProductName </th><th> Image </th> <th> Price </th><th> Qty </th><th> SubTotal </th></tr>');
                var currencySymbol = 'Rs. ';
                var currencyCode = '';
                for (var i = 0; i < data.result.length; i++) {
                    var productPrice = data.result[i].productPrice;
                    var productAmount = data.result[i].productAmount;
                    var totalAmount = data.result[i].totalAmount;
                    var discountAmount = data.result[i].discountAmount;
                    var additionalCharge = data.result[i].additionalCharge;
                    if (data.result[i].hasOwnProperty('storeCurrency') && data.result[i].storeCurrency != "" && data.result[i].storeCurrency != null) {
                        currencySymbol = '';
                        currencyCode = data.result[i].storeCurrency;
                    }
                    if (data.result[i].hasOwnProperty('transactionCurrency') && data.result[i].transactionCurrency != "" && data.result[i].transactionCurrency != null) {
                        currencySymbol = '';
                        currencyCode = data.result[i].transactionCurrency;
                        productPrice = data.result[i].priceInTransactCurrency;
                        productAmount = data.result[i].productAmountInTransactionCurrency;
                        totalAmount = data.result[i].totalAmountInTransactionCurrency;
                        discountAmount = data.result[i].discountAmountInTransactCurrency;
                        additionalCharge = data.result[i].additionalChargeInTransactCurrency;
                    }
                    var cartItemHtml = '<tr class="viamagus-cart-item-row" >';
                    cartItemHtml = cartItemHtml + '<td data-title="Product Name">' + data.result[i].productName + '</td>';
                    cartItemHtml = cartItemHtml + '<td><a class="viamagus-image-lightbox" href="#"><img class="viamagus-product-image-url" style="width:50px;height:auto;" src="' + data.result[i].productImageUrl + '"></a></td>';
                    cartItemHtml = cartItemHtml + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="viamagus-product-price viamagus-format-number">';
                    cartItemHtml = cartItemHtml + ' ' + productPrice + '</span>  ' + currencyCode;
                    if (data.result[i].hasOwnProperty('weightUnit') && data.result[i].weightUnit != null) {
                        cartItemHtml = cartItemHtml + '/' + data.result[i].weightUnit + '</td>';
                    }
                    cartItemHtml = cartItemHtml + '<td class="numeric" data-title="Quantity">' + data.result[i].productQty + '</td>';
                    cartItemHtml = cartItemHtml + '<td class="numeric sub-total" ><b>' + currencySymbol + '<span class="viamagus-product-subtotal row-subtotal viamagus-format-number">' + productAmount + '</span> ' + currencyCode + '</b></td>';
                    cartItemHtml = cartItemHtml + '</tr>';
                    $('#order-summary-body').append(cartItemHtml);
                }
                if (data.result[0].discountCode != null && data.result[0].discountCode != "") {
                    $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Discount Code : ' + data.result[0].discountCode + '</td></tr>');
                    $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Discount Amount : ' + currencySymbol + '<span class="viamagus-format-number"> ' + discountAmount + '</span> ' + currencyCode + '</b></td></tr>');
                }
                if (additionalCharge != null && additionalCharge != "") {
                    $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Additional Charge : ' + currencySymbol + '<span class="viamagus-format-number"> ' + additionalCharge + '</span> ' + currencyCode + '</b></td></tr>');
                }
                $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Total Amount : ' + currencySymbol + '<span class="viamagus-format-number"> ' + totalAmount + '</span> ' + currencyCode + '</b></td></tr>');
            }
            $('.viamagus-format-number').number(true, 2);
            Viamagus_Cart_Manager.resetCart();
        });
    },
    loadFormProductPaymentSuccessSummary: function(entitytype, entityId) {
        var that = this;
        var url = that._contextPath + '/REST/payment/loadFormOrderSummary';
        $.ajax({
            url: url,
            data: {
                entityType: entitytype,
                entityId: entityId
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result && data.result.length) {
                if (data.result[0].isCustomPayment == 'N') {
                    $('#order-summary-header').empty();
                    $('#order-summary-body').empty();
                    $('#order-summary-header').append('<tr><th>Product Name</th><th >Price</th> <th >Quantity</th> <th >Sub Total</th> </tr>        ');
                    var currencySymbol = 'Rs. ';
                    var currencyCode = '';
                    var totalAmount = 0;
                    var additionalChargeAmt = 0;
                    var additionalChargeName = '';
                    for (var i = 0; i < data.result.length; i++) {
                        var product = data.result[i];
                        totalAmount = product.totalAmount;
                        if (product.isCustomPayment == 'N') {
                            var productPrice = product.productPrice;
                            var productAmount = product.paymentAmount;
                            if (product.hasOwnProperty('additionalChargeAmount') && product.additionalChargeAmount != '') {
                                additionalChargeAmt = product.additionalChargeAmount;
                                additionalChargeName = product.additionalChargeName;
                            }
                            if (product.hasOwnProperty('txnCurrency') && product.txnCurrency != '') {
                                currencySymbol = '';
                                currencyCode = product.txnCurrency;
                                productPrice = product.productPriceInTxnCur;
                                productAmount = product.productAmtInTxnCur;
                                if ($('.vm-form-payment-currency-code').length) {
                                    $('.vm-form-payment-currency-symbol').html('');
                                    $('.vm-form-payment-currency-code').html(currencyCode);
                                }
                            }
                            $('.viamagus-form-product-summary').show();
                            var productRow = '<tr class="viamagus-product-summary-row" > ';
                            productRow = productRow + '<td data-title="Product Name">' + product.productName + '</td>';
                            if (product.discountAmount != null && product.discountAmount != "") {
                                productRow = productRow + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="vm-format-number">' + product.discountAmount + '</span> <strike style="color:red;">(<span class="vm-format-number">' + productPrice + '</span>) ' + currencyCode + '</strike></td>';
                            } else {
                                productRow = productRow + '<td class="numeric" data-title="Price">' + currencySymbol + '<span class="vm-format-number">' + productPrice + '</span> ' + currencyCode + '</td>';
                            }
                            productRow = productRow + '<td class="numeric" data-title="Quantity">' + product.productQty + '</td>';
                            productRow = productRow + '<td class="numeric sub-total"><b>' + currencySymbol + '<span class="vm-format-number row-subtotal">' + productAmount + '</span> ' + currencyCode + '</b></td> <tr>';
                            $('#order-summary-body').append(productRow);
                        }
                    }
                    if (additionalChargeName != '' && additionalChargeName != null) {
                        totalAmount = parseFloat(totalAmount) + parseFloat(additionalChargeAmt);
                        $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>' + additionalChargeName + ' : ' + currencySymbol + '<span class="vm-format-number"> ' + additionalChargeAmt + '</span> ' + currencyCode + '</b></td></tr>');
                        $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Total Amount : ' + currencySymbol + '<span class="vm-format-number"> ' + totalAmount + '</span> ' + currencyCode + '</b></td></tr>');
                    } else {
                        $('#order-summary-body').append('<tr><td colspan="5"  style="text-align:right;"><b>Total Amount : ' + currencySymbol + '<span class="vm-format-number"> ' + totalAmount + '</span> ' + currencyCode + '</b></td></tr>');
                    }
                }
                $('.vm-format-number').number(true, 2);
            }
        });
    },
    _defaultCustomerInfo: function() {
        var that = this;
        var url = that._contextPath + '/REST/ecommerce/getCustomerInfo';
        $.ajax({
            url: url,
            data: {},
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result) {
                $('#customerName').val(data.result.customerName);
                $('#customerEmail').val(data.result.userName);
                $('#customerPhoneNo').val(data.result.phoneNo);
                $('#addressLineOne').val(data.result.addressLineOne);
                $('#addressLineTwo').val(data.result.addressLineTwo);
                $('#state').val(data.result.state);
                $('#city').val(data.result.city);
                if (data.result.country != null && data.result.country != "") {
                    $('#country').val(data.result.country);
                }
                $('#pincode').val(data.result.pincode);
            }
        });
    },
    initAndroidBridgeOnPayuTransactionOver: function(status) {
        var input = JSON.stringify({
            txnId: this.getParameter('txnId'),
            status: status
        });
        if (typeof PayU != "undefined") {
            $('.viamagus_header').hide();
            if (status == 'success') {
                PayU.onSuccess(input);
            }
            if (status == 'failed') {
                PayU.onFailure(input);
            }
        }
    },
    _initGoogleMap: function() {
        if ($('.viamagus-form-google-map').length) {
            $('.viamagus-form-google-map').each(function(index, e) {
                var searchInputField = $(e).find('.search-input');
                var googleMapPlaceHolder = '#' + searchInputField.attr("data-comp-id") + "_Map";
                var searchbutton = $(e).find('.search-button');
                searchInputField.geocomplete({
                    map: googleMapPlaceHolder,
                    location: 'Bangalore',
                    markerOptions: {
                        draggable: true
                    }
                }).bind("geocode:result", function(event, result) {
                    $(this).attr("data-geo-lat", result.geometry.location.lat());
                    $(this).attr("data-geo-lng", result.geometry.location.lng());
                    $(googleMapPlaceHolder).attr("data-geo-lat", result.geometry.location.lat());
                    $(googleMapPlaceHolder).attr("data-geo-lng", result.geometry.location.lng());
                }).bind("geocode:dragged", function(event, latLng) {
                    $(this).attr("data-geo-lat", latLng.lat());
                    $(this).attr("data-geo-lng", latLng.lng());
                    $(googleMapPlaceHolder).attr("data-geo-lat", result.geometry.location.lat());
                    $(googleMapPlaceHolder).attr("data-geo-lng", result.geometry.location.lng());
                });
                searchbutton.click(function() {
                    searchInputField.trigger("geocode");
                });
            });
            this._initAddressOnchangeEvent();
        }
    },
    _initAddressCountryStateCityLoad: function() {
        if ($('.viamagus-address').length) {
            this.loadMasterCountryStateCityList();
        }
        if ($('.viamagus-address-clear-values').length) {
            this.initClearAddressEvent();
        }
    },
    _initAddressOnchangeEvent: function() {
        $('.viamagus-address-input').unbind();
        $('.viamagus-address-input').change(function(e) {
            $('.viamagus-address').each(function(index, e) {
                var captureMap = $(e).attr("data-capture-map");
                var compId = '#' + $(e).attr("data-comp-id");
                if (captureMap == "true") {
                    var addressLineOne = $(compId + "_Line_One").val();
                    var addressLineTwo = $(compId + "_Line_Two").val();
                    var city = $(compId + "_city").val();
                    var state = $(compId + "_state").val();
                    var country = $(compId + "_country").val();
                    var pincode = $(compId + "_pincode").val();
                    var address = (addressLineOne != '' ? addressLineOne : "") + (addressLineTwo != '' ? "," + addressLineTwo : "") + (city != '' ? "," + city : "") + (state != '' ? "," + state + " " : "") + (pincode != '' ? pincode : "") + (country != '' ? "," + country : "");
                    $(compId + "_Map_Location").val(address);
                }
            });
        });
    },
    _initOTPGenerateEvents: function() {
        var that = this;
        if ($('.viamagus-otp-section').length) {
            $('.generate-otp-button').unbind();
            $('.generate-otp-button').click(function(e) {
                var customerPhoneFieldId = $(this).attr("data-phone-id");
                var phoneNo = $('#' + customerPhoneFieldId).val();
                if (phoneNo == "") {
                    alert("Please enter the phone no.");
                    return;
                }
                that.sendOtpToCustomer(phoneNo, customerPhoneFieldId, $(this));
                $(this).text("Resend OTP");
            });
            $('.viamagus-otp-input-validate').unbind();
            $('.viamagus-otp-input-validate').click(function(e) {
                var customerPhoneFieldId = $(this).attr("data-phone-id");
                var userEnteredOTP = $('#' + customerPhoneFieldId + '-otp').val();
                that.validateOTPEnteredByCustomer(userEnteredOTP, customerPhoneFieldId, $(this))
            });
        }
    },
    _initEmailOTPGenerateEvents: function() {
        var that = this;
        if ($('.viamagus-email-otp-section').length) {
            $('.generate-email-otp-button').unbind();
            $('.generate-email-otp-button').click(function(e) {
                var customerEmailFieldId = $(this).attr("data-email-id");
                var emailId = $('#' + customerEmailFieldId).val();
                if (emailId == "") {
                    alert("Please enter the email id.");
                    return;
                }
                that.sendEmailOtpToCustomer(emailId, customerEmailFieldId, $(this));
                $(this).text("Resend OTP");
            });
            $('.viamagus-email-otp-input-validate').unbind();
            $('.viamagus-email-otp-input-validate').click(function(e) {
                var customerEmailFieldId = $(this).attr("data-email-id");
                var userEnteredOTP = $('#' + customerEmailFieldId + '-email-otp').val();
                that.validateEmailOTPEnteredByCustomer(userEnteredOTP, customerEmailFieldId, $(this))
            });
        }
    },
    sendOtpToCustomer: function(phoneNo, phoneObjId, generateBtn) {
        var that = this;
        if (phoneNo != "") {
            phoneNo = phoneNo.replace("+", "");
            phoneNo = phoneNo.replace(/ /g, "");
            var url = that._contextPath + '/REST/communication/sendOTPToCustomer';
            $.ajax({
                url: url,
                data: {
                    customerPhone: phoneNo
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                $('#' + phoneObjId + "-otp-validate-section").show();
                $('#' + phoneObjId + '-otp-generate-required').hide();
                $('#' + phoneObjId + '-otp-generate-message').show();
                generateBtn.hide();
                that.startOTPTimer(2 * 60, $('#' + phoneObjId + '-otp-counter'), function() {
                    if ($('#' + phoneObjId + '-otp').attr("data-otp-validation-status") != "success") {
                        generateBtn.show();
                        $('#' + phoneObjId + '-otp-generate-message').hide();
                    }
                });
            });
        }
    },
    sendEmailOtpToCustomer: function(emailId, emailObjId, generateBtn) {
        var that = this;
        if (emailId != "") {
            var url = that._contextPath + '/REST/communication/sendEmailOTPToCustomer';
            $.ajax({
                url: url,
                data: {
                    customerEmail: emailId
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                $('#' + emailObjId + "-email-otp-validate-section").show();
                $('#' + emailObjId + '-email-otp-generate-required').hide();
                $('#' + emailObjId + '-email-otp-generate-message').show();
                generateBtn.hide();
                that.startOTPTimer(2 * 60, $('#' + emailObjId + '-email-otp-counter'), function() {
                    if ($('#' + emailObjId + '-email-otp').attr("data-otp-validation-status") != "success") {
                        generateBtn.show();
                        $('#' + emailObjId + '-email-otp-generate-message').hide();
                    }
                });
            });
        }
    },
    validateOTPEnteredByCustomer: function(userEnteredOtp, phoneObjId, validateBtn) {
        var that = this;
        if (userEnteredOtp != "") {
            var otpType = "phone";
            var url = that._contextPath + '/REST/communication/validateOTP';
            $.ajax({
                url: url,
                data: {
                    userEnteredOTP: userEnteredOtp,
                    otpType: otpType
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result && data.result == "Y") {
                    $('#' + phoneObjId + '-otp').attr("data-otp-validation-status", "success");
                    $('#' + phoneObjId + '-otp-success-msg').show();
                    $('#' + phoneObjId + '-otp-error-msg').hide();
                    $('#' + phoneObjId + '-otp-generate-btn').hide();
                    $('#' + phoneObjId + '-otp-generate-required').hide();
                    $('#' + phoneObjId).attr("readonly", "readonly");
                    $('#' + phoneObjId + '-otp-validate-section').hide();
                    $('#' + phoneObjId + '-otp-generate-btn').hide();
                } else {
                    $('#' + phoneObjId + '-otp-success-msg').hide();
                    $('#' + phoneObjId + '-otp-error-msg').show();
                    $('#' + phoneObjId + '-otp-generate-btn').show();
                    $('#' + phoneObjId).removeAttr("readonly");
                    $('#' + phoneObjId + '-otp').removeAttr("readonly");
                    validateBtn.removeAttr("disabled");
                }
                $('#' + phoneObjId + '-otp-generate-message').hide();
            }).fail(function() {
                $('#' + phoneObjId + '-otp-error-msg').show();
            });;
        }
    },
    validateEmailOTPEnteredByCustomer: function(userEnteredOtp, emailObjId, validateBtn) {
        var that = this;
        var otpType = "email";
        if (userEnteredOtp != "") {
            var url = that._contextPath + '/REST/communication/validateOTP';
            $.ajax({
                url: url,
                data: {
                    userEnteredOTP: userEnteredOtp,
                    otpType: otpType,
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result && data.result == "Y") {
                    $('#' + emailObjId + '-email-otp').attr("data-otp-validation-status", "success");
                    $('#' + emailObjId + '-email-otp-success-msg').show();
                    $('#' + emailObjId + '-email-otp-error-msg').hide();
                    $('#' + emailObjId + '-email-otp-generate-btn').hide();
                    $('#' + emailObjId + '-email-otp-generate-required').hide();
                    $('#' + emailObjId).attr("readonly", "readonly");
                    $('#' + emailObjId + '-email-otp-validate-section').hide();
                    $('#' + emailObjId + '-email-otp-generate-btn').hide();
                } else {
                    $('#' + emailObjId + '-email-otp-success-msg').hide();
                    $('#' + emailObjId + '-email-otp-error-msg').show();
                    $('#' + emailObjId + '-email-otp-generate-btn').hide();
                    $('#' + emailObjId).removeAttr("readonly");
                    $('#' + emailObjId + '-email-otp').removeAttr("readonly");
                    validateBtn.removeAttr("disabled");
                }
                $('#' + emailObjId + '-email-otp-generate-message').hide();
            }).fail(function() {
                $('#' + emailObjId + '-email-otp-error-msg').show();
            });;
        }
    },
    startOTPTimer: function(duration, display, callback) {
        var timer = duration,
            minutes, seconds;
        display.text("");
        var otpTimer = setInterval(function() {
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            display.text(minutes + ":" + seconds);
            if (--timer == 0) {
                if (callback) {
                    callback();
                }
            } else if (timer < -1) {
                clearInterval(otpTimer);
            }
        }, 1000);
    },
    _initGoogleDistanceCalculator: function() {
        var that = this;
        if ($('.viamagus-form-google-distance-calculator').length) {
            $('.viamagus-form-google-distance-calculator').each(function(index, e) {
                var compId = $(e).attr("data-comp-id");
                var sourceLocationObj = $('#' + compId + "_Source");
                var destinationLocationObj = $('#' + compId + "_Destination");
                var showMap = $(e).attr("data-show-map");
                var showDistance = $(e).attr("data-show-distance");
                sourceLocationObj.geocomplete().bind("geocode:result", function(event, result) {
                    $(this).attr("data-geo-lat", result.geometry.location.lat());
                    $(this).attr("data-geo-lng", result.geometry.location.lng());
                    that._initGoogleDirection(sourceLocationObj, destinationLocationObj, compId, showMap, showDistance);
                });
                destinationLocationObj.geocomplete().bind("geocode:result", function(event, result) {
                    $(this).attr("data-geo-lat", result.geometry.location.lat());
                    $(this).attr("data-geo-lng", result.geometry.location.lng());
                    that._initGoogleDirection(sourceLocationObj, destinationLocationObj, compId, showMap, showDistance);
                });
                that._initGoogleDirection(sourceLocationObj, destinationLocationObj, compId, showMap, showDistance);
            });
        }
    },
    _initGoogleDirection: function(sourceObj, destinationObj, fieldId, showMap, showDistance) {
        var that = this;
        var origin, destination = null;
        if (showMap == "true") {
            var map = new google.maps.Map(document.getElementById(fieldId + '_Map'), {
                zoom: 4,
                center: {
                    lat: 19.1376666,
                    lng: 79.0811348
                }
            });
            $('body').append('<input type="hidden" name="totalDistanceInKm" id="totalDistanceInKm" >');
            document.getElementById(fieldId + '_Display_Panel').style.display = 'none';
            if (sourceObj.attr("data-geo-lat") != "" && sourceObj.attr("data-geo-lng") != "") {
                origin = new google.maps.LatLng(sourceObj.attr("data-geo-lat"), sourceObj.attr("data-geo-lng"));
            }
            if (destinationObj.attr("data-geo-lat") != "" && destinationObj.attr("data-geo-lng") != "") {
                destination = new google.maps.LatLng(destinationObj.attr("data-geo-lat"), destinationObj.attr("data-geo-lng"));
            }
            if (origin != null && destination != null) {
                var directionsService = new google.maps.DirectionsService;
                var directionsDisplay = new google.maps.DirectionsRenderer({
                    draggable: true,
                    map: map,
                    panel: document.getElementById(fieldId + '__Display_Panel')
                });
                directionsDisplay.addListener('directions_changed', function() {
                    that._computeTotalDistance(directionsDisplay.getDirections(), fieldId, showDistance, sourceObj, destinationObj);
                });
                that._displayRoute(origin, destination, directionsService, directionsDisplay);
            }
        }
    },
    _displayRoute: function(origin, destination, service, display, fieldId) {
        var that = this;
        service.route({
            origin: origin,
            destination: destination,
            waypoints: [],
            travelMode: google.maps.TravelMode.DRIVING,
            avoidTolls: true
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                display.setDirections(response);
            } else {
                alert('Could not display directions due to: ' + status);
            }
        });
    },
    _computeTotalDistance: function(result, fieldId, showDistance, sourceObj, destinationObj) {
        var total = 0;
        var myroute = result.routes[0];
        for (var i = 0; i < myroute.legs.length; i++) {
            total += myroute.legs[i].distance.value;
        }
        var dstlatlng = {
            lat: result.request.destination.lat(),
            lng: result.request.destination.lng()
        };
        var srclatlng = {
            lat: result.request.origin.lat(),
            lng: result.request.origin.lng()
        };
        var srcgeocoder = new google.maps.Geocoder;
        var dstgeocoder = new google.maps.Geocoder;
        srcgeocoder.geocode({
            'location': srclatlng
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    sourceObj.val(results[1].formatted_address);
                }
            }
        });
        dstgeocoder.geocode({
            'location': dstlatlng
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    destinationObj.val(results[1].formatted_address);
                }
            }
        });
        total = total / 1000;
        if (showDistance == "true") {
            if (total == 0) {
                document.getElementById(fieldId + '_Display_Panel').style.display = 'none';
            } else {
                document.getElementById(fieldId + '_Display_Panel').style.display = 'block';
                document.getElementById(fieldId + '_distance').innerHTML = total + ' km';
                if ($('#totalDistanceInKm').length) {
                    $('#totalDistanceInKm').val(total);
                    $('#totalDistanceInKm').trigger('change');
                }
            }
        }
    },
    _loadCustomPaymentCurrencyList: function() {
        var that = this;
        if ($('.vm-custom-payment-currency').length) {
            $.ajax({
                url: that._contextPath + '/REST/ecommerce/currencylist/',
                type: 'POST',
                data: {
                    format: 'json'
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result != null && data.result.length) {
                    $('.vm-custom-payment-currency').empty();
                    for (var i = 0; i < data.result.length; i++) {
                        var option = new Option(data.result[i].currencyCode, data.result[i].currencyCode)
                        if ("Y" == data.result[i].isSelected) {
                            $(option).attr("selected", "selected");
                        }
                        $(option).attr("data-currency-symbol", data.result[i].currencySymbol);
                        $('.vm-custom-payment-currency').append(option);
                    }
                }
            });
        }
    },
    _loadDirectPaymentCurrencyList: function(callback) {
        var that = this;
        if ($('.vm-direct-payment-currency').length) {
            $.ajax({
                url: that._contextPath + '/REST/ecommerce/currencylist/',
                type: 'POST',
                data: {
                    format: 'json'
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result != null && data.result.length) {
                    $('.vm-direct-payment-currency').empty();
                    var passedOnCurrency = $('.vm-direct-payment-currency').attr("data-payment-currency");
                    for (var i = 0; i < data.result.length; i++) {
                        var option = new Option(data.result[i].currencyCode, data.result[i].currencyCode)
                        if (passedOnCurrency == data.result[i].currencyCode) {
                            $(option).attr("selected", "selected");
                        }
                        $(option).attr("data-currency-symbol", data.result[i].currencySymbol);
                        $('.vm-direct-payment-currency').append(option);
                    }
                    that.registerOnPaymentCurrecyChangeEvent();
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    },
    registerOnPaymentCurrecyChangeEvent: function() {
        var that = this;
        $('.vm-direct-payment-currency').unbind();
        $('.vm-direct-payment-currency').change(function(e) {
            that._loadPaymentMode();
        });
    },
    loadMasterCountryStateCityList: function() {
        var that = this;
        if ($('.vm-country-list').length) {
            $('.vm-country-list').each(function(index, e) {
                $.ajax({
                    url: that._contextPath + '/REST/general/countrylist/',
                    type: 'POST',
                    data: {
                        format: 'json'
                    },
                    dataType: 'jsonp',
                    jsonp: 'jsonCallback'
                }).done(function(data) {
                    if (data.result != null && data.result.length) {
                        $(e).empty();
                        var selectedCountryName = $(e).attr("data-country-name");
                        var defaultCountry = $(e).attr("data-default-country");
                        $(e).append(new Option("Select Country", ""));
                        for (var i = 0; i < data.result.length; i++) {
                            var option = new Option(data.result[i].countryName, data.result[i].countryName);
                            $(option).attr("data-country-id", data.result[i].countryId);
                            $(option).attr("data-country-code", data.result[i].countryCode);
                            if (selectedCountryName != "" && selectedCountryName == data.result[i].countryName) {
                                $(option).attr("selected", "selected");
                                that.loadStateList($(option).attr("data-country-id"), $(e).attr("id").replace("country", "state"));
                            }
                            $(e).append(option);
                        }
                        if (defaultCountry != "" && defaultCountry == "true") {
                            that.fetchUserCountryBasedOnIp($(e).attr("id"));
                        }
                        that.registerOnCountryChangeEvent();
                    }
                });
            });
        }
    },
    registerOnCountryChangeEvent: function() {
        var that = this;
        if ($('.vm-country-list').length) {
            $('.vm-country-list').unbind();
            $('.vm-country-list').change(function(e) {
                that.loadStateList($(this).find('option:selected').attr("data-country-id"), $(this).attr("id").replace("country", "state"));
            });
        }
    },
    loadStateList: function(countryId, stateObjId) {
        var that = this;
        if ($('#' + stateObjId).length) {
            $.ajax({
                url: that._contextPath + '/REST/general/statelist/',
                type: 'POST',
                data: {
                    format: 'json',
                    countryId: countryId
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result != null && data.result.length) {
                    $('#' + stateObjId).empty();
                    var selectedStateName = $('#' + stateObjId).attr("data-state-name");
                    $('#' + stateObjId).append(new Option("Select State", ""));
                    for (var i = 0; i < data.result.length; i++) {
                        var option = new Option(data.result[i].stateName, data.result[i].stateName);
                        $(option).attr("data-state-id", data.result[i].stateId);
                        $(option).attr("data-state-code", data.result[i].stateCode);
                        if (selectedStateName != "" && selectedStateName == data.result[i].stateName) {
                            $(option).attr("selected", "selected");
                            that.loadCityList($(option).attr("data-state-id"));
                        }
                        $('#' + stateObjId).append(option);
                    }
                }
            });
        }
    },
    registerOnStateChangeEvent: function() {
        var that = this;
        if ($('.vm-state-list').length) {
            $('.vm-state-list').unbind();
            $('.vm-state-list').change(function(e) {
                that.loadCityList($(this).find('option:selected').attr("data-state-id"));
            });
        }
    },
    loadCityList: function(stateId) {
        var that = this;
        if ($('.vm-city-list').length) {
            $.ajax({
                url: that._contextPath + '/REST/general/citylist/',
                type: 'POST',
                data: {
                    format: 'json',
                    stateId: stateId
                },
                dataType: 'jsonp',
                jsonp: 'jsonCallback'
            }).done(function(data) {
                if (data.result != null && data.result.length) {
                    $('.vm-city-list').empty();
                    var selectedCityName = $('.vm-state-list').attr("data-city-name");
                    for (var i = 0; i < data.result.length; i++) {
                        var option = new Option(data.result[i].cityName, data.result[i].cityName)
                        if (selectedCityName != "" && selectedCityName == data.result[i].cityName) {
                            $(option).attr("selected", "selected");
                        }
                        $(option).attr("data-city-id", data.result[i].cityId);
                        $('.vm-city-list').append(option);
                    }
                }
            });
        }
    },
    initOnPaymentModeChangeEvent: function() {
        var that = this;
        $('input[type=radio][name=paymentMode]').unbind();
        $('input[type=radio][name=paymentMode]').on('change', function() {
            that.loadAdditionalChargeDetails($(this).val());
        });
        window.setTimeout(function() {
            that.loadAdditionalChargeDetails($('input[name="paymentMode"]:checked').val());
        }, 500);
    },
    loadAdditionalChargeDetails: function(paymentMode) {
        var that = this;
        $('#Submit').prop('disabled', true);
        var originalPaymentAmount = $('#paymentAmount').attr("data-payment-amount");
        $.ajax({
            url: that._contextPath + '/REST/payment/getAdditionalChargeDetails/',
            type: 'POST',
            data: {
                format: 'json',
                paymentMode: paymentMode,
                paymentAmount: originalPaymentAmount,
                paymentCurrency: $('#paymentCurrency').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result != null) {
                if ($('#additionalChargeAmount').length) {
                    if (data.result.chargeAmount != "" && parseFloat(data.result.chargeAmount) > 0) {
                        if (originalPaymentAmount != 'undefined' && originalPaymentAmount != "") {
                            $('.vm-additional-charge-amt').show();
                            $('#additionalChargeAmount').val(data.result.chargeAmount);
                            $('.vm-additional-charge-amt-value').html(data.result.chargeAmount);
                            $('#additionalChargeMessage').val(data.result.emailMessage);
                            $('#additionalChargeName').val(data.result.chargeName);
                            $('#checkOutSummaryTotalNumber').html(data.result.totalPayableAmount);
                            $('#paymentAmount').val(data.result.totalPayableAmount);
                            $('.vm-additional-charge-name').html(data.result.chargeName);
                            if (data.result.message != "") {
                                $('.vm-additional-charge-section').html(data.result.message + " Total Amount:" + data.result.totalPayableAmount + " " + $('#paymentCurrency').val());
                            }
                            $('.vm-format-number').number(true, 2);
                        }
                    }
                }
            } else {
                $('.vm-additional-charge-amt').hide();
                $('#checkOutSummaryTotalNumber').html(originalPaymentAmount);
                $('#paymentAmount').val(originalPaymentAmount);
                $('#additionalChargeMessage').val('');
                $('#additionalChargeName').val('');
                $('#additionalChargeAmount').val('');
                $('.vm-additional-charge-section').html('');
            }
            $('#Submit').prop('disabled', false);
        });
    },
    initOnPaymentModeEcommChangeEvent: function() {
        var that = this;
        $('input[type=radio][name=paymentMode]').unbind();
        $('input[type=radio][name=paymentMode]').on('change', function() {
            that.loadEcommerceAdditionalChargeDetails($(this).val());
        });
        window.setTimeout(function() {
            that.loadEcommerceAdditionalChargeDetails($('input[name="paymentMode"]:checked').val());
        }, 1500);
    },
    loadEcommerceAdditionalChargeDetails: function(paymentMode) {
        var that = this;
        var originalPaymentAmount = $('#paymentAmount').attr("data-payment-amount");
        $.ajax({
            url: that._contextPath + '/REST/payment/getAdditionalChargeDetails/',
            type: 'POST',
            data: {
                format: 'json',
                paymentMode: paymentMode,
                paymentAmount: originalPaymentAmount,
                paymentCurrency: $('#paymentCurrency').val()
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result != null) {
                if ($('#additionalChargeAmount').length) {
                    if (data.result.chargeAmount != "" && parseFloat(data.result.chargeAmount) > 0) {
                        if (originalPaymentAmount != 'undefined' && originalPaymentAmount != "") {
                            $('#orderSummaryAdditionalChargeRow').show();
                            $('#cartAdditionalChargeName').html(data.result.chargeName);
                            $('#cartAdditionalChargeAmount').html(data.result.chargeAmount);
                            $('#shoppingCartTotal').html(data.result.totalPayableAmount);
                            $('vm-additional-charge-amt').show();
                            $('#additionalChargeAmount').val(data.result.chargeAmount);
                            $('.vm-additional-charge-amt-value').html(data.result.chargeAmount);
                            $('#additionalChargeMessage').val(data.result.emailMessage);
                            $('#additionalChargeName').val(data.result.chargeName);
                            $('#checkOutSummaryTotalNumber').html(data.result.totalPayableAmount);
                            $('#paymentAmount').val(data.result.totalPayableAmount);
                            $('.vm-additional-charge-name').html(data.result.chargeName);
                            if (data.result.message != "") {
                                $('.vm-additional-charge-section').html(data.result.message + " Total Amount:" + data.result.totalPayableAmount + " " + $('#paymentCurrency').val());
                            }
                            if (data.result.chargeAmountInBaseCur != null || data.result.chargeAmountInBaseCur) {
                                $("#cartAdditionalChargeAmount").attr("data-additional-Charge-Amount-In-BaseCur", data.result.chargeAmountInBaseCur);
                            }
                            $('.vm-format-number').number(true, 2);
                        }
                    }
                }
            } else {
                $('#orderSummaryAdditionalChargeRow').hide();
                $('#cartAdditionalChargeName').html("");
                $('#cartAdditionalChargeAmount').html("");
                $('#shoppingCartTotal').html(originalPaymentAmount);
                $('.vm-additional-charge-amt').hide();
                $('#checkOutSummaryTotalNumber').html(originalPaymentAmount);
                $('#paymentAmount').val(originalPaymentAmount);
                $('#additionalChargeMessage').val('');
                $('#additionalChargeName').val('');
                $('#additionalChargeAmount').val('');
                $('.vm-additional-charge-section').html('');
            }
        });
    },
    fetchUserCountryBasedOnIp: function(dropdownObjId) {
        var that = this;
        if (that._ipInfoResult == null) {
            $.getJSON("http://freegeoip.net/json/", function(result) {
                var countryName = result.country_name;
                that._ipInfoResult = result;
                $('#' + dropdownObjId.replace('country', 'state')).attr("data-state-name", result.region_name);
                $('#' + dropdownObjId.replace('country', 'city')).val(result.city);
                $('#' + dropdownObjId + ' option').each(function() {
                    if ($(this).text() == countryName) {
                        $(this).attr("selected", "selected");
                        $(this).prop("selected", true);
                        $('#' + dropdownObjId).val(countryName);
                        $('#' + dropdownObjId).trigger('change');
                    }
                });
            });
        } else {
            $('#' + dropdownObjId.replace('country', 'state')).attr("data-state-name", that._ipInfoResult.region_name);
            $('#' + dropdownObjId.replace('country', 'city')).val(that._ipInfoResult.city);
            $('#' + dropdownObjId + ' option').each(function() {
                if ($(this).text() == that._ipInfoResult.country_name) {
                    $(this).attr("selected", "selected");
                    $(this).prop("selected", true);
                    $('#' + dropdownObjId).val(that._ipInfoResult.country_name);
                    $('#' + dropdownObjId).trigger('change');
                }
            });
        }
    },
    initClearAddressEvent: function() {
        $('.viamagus-address-clear-values').unbind();
        $('.viamagus-address-clear-values').click(function(e) {
            e.preventDefault();
            var fieldId = $(this).attr("data-field-id");
            $('#' + fieldId + '_Line_One').val('');
            $('#' + fieldId + '_Line_Two').val('');
            $('#' + fieldId + '_country').val('');
            $('#' + fieldId + '_state').val('');
            $('#' + fieldId + '_city').val('');
            $('#' + fieldId + '_pincode').val('');
        });
    },
    _loadFormProductQtyInfo: function(formId, baseCurrency) {
        var that = this;
        $.ajax({
            url: that._contextPath + '/REST/formbuilder/loadFormQtyInfo',
            type: 'POST',
            data: {
                format: 'json',
                formId: formId
            },
            dataType: 'jsonp',
            jsonp: 'jsonCallback'
        }).done(function(data) {
            if (data.result != null && data.result.length > 0) {
                for (var i = 0; i < data.result.length; i++) {
                    var product = {};
                    product.name = data.result[i].productName;
                    product.availableQty = parseInt(data.result[i].maxQty) - parseInt(data.result[i].soldQty);
                    if (product.availableQty < 0) {
                        product.availableQty = 0;
                    }
                    that._productQtyInfo.push(product);
                }
                that._calculateProductAmount(formId, baseCurrency);
            }
        });
    },
    checkProductAvailability: function(productRowObj) {
        var that = this;
        var productName = productRowObj.attr("data-product-name");
        var qty = parseInt(productRowObj.find("#productQty").val());
        if (that._productQtyInfo.length > 0) {
            for (var i = 0; i < that._productQtyInfo.length; i++) {
                var product = that._productQtyInfo[i];
                if (productName == product.name) {
                    if (productRowObj.find('.vm-product-available-msg').length) {
                        productRowObj.find('.vm-product-available-msg').remove();
                    }
                    if (product.availableQty == 0) {
                        $('<p class="vm-product-available-msg" style="color:red;"> SOLD OUT </p>').insertAfter(productRowObj.find('.viamagus-product-qty'));
                        productRowObj.find("#productQty").val(0);
                        if (productRowObj.find("#productCheckBox").length) {
                            productRowObj.find("#productCheckBox").removeAttr("checked");
                            productRowObj.find("#productCheckBox").attr("disabled", "disabled");
                        }
                    } else if (qty > product.availableQty) {
                        $('<p class="vm-product-available-msg" style="color:red;"> AVAILABLE: ' + product.availableQty + ' </p>').insertAfter(productRowObj.find('.viamagus-product-qty'));
                        productRowObj.find("#productQty").val(product.availableQty);
                    }
                }
            }
        }
    },
    invokeCustomFormValidation: function() {
        if (typeof validateFormCustomValidations === "function") {
            return validateFormCustomValidations();
        }
        return true;
    }
}