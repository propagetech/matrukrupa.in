function viamagusTransactionManager(options) {
	// Becomes this.options
	var defaults = {
		url : '',
		type : 'POST',
		data : null,
		viamagusLoader : null,
		callback : null,
		response : null,
		successMsg : null,
		errorCallBack:null,
		primaryKey:null,
        showSuccessMsg:true
	};

	this.options = jQuery.extend(defaults, options);

	this.startTransaction = function() {
		var that = this;
		// alert(this.options.url);
		if (!options.async) {
			this.options.viamagusloader = new viamagusLoader('body');
		}
		$.ajax({
			url : this.options.url,
			type : this.options.type,
			data : this.options.data,
			dataType : 'jsonp',
			jsonp : 'jsonCallback'
		}).done(
				function(data) {
					that.response = data;
					that.checkTransactionStatus(data.result.transactionRefNo,
							false, that)
		}).fail(function(data) {
               that.response = data;
               that.options.transactionStatus = false;
               that.endTransaction();
        });
	};
	this.checkTransactionStatus = function(transactionRefNo,
			isTransactionComplete, self) {
		// var that = this;
		// alert(transactionRefNo);
		if (!isTransactionComplete) {
			$
					.ajax({
						url : '/REST/general/checkTransactionStatus',
						type : 'POST',
						data : {
							format : 'json',
							transactionRefNo : transactionRefNo

						},
						dataType : 'jsonp',
						jsonp : 'jsonCallback'
					})
					.done(
							function(data) {
						          if ($('#alert-message').length) {
										$('#alert-message').remove();
									}
								// alert(data.result.transactionStatus);
								if (data.result.transactionStatus == "Failed") {
									self.options.transactionStatus = false;
									
									var failedHtml = '<div id ="alert-message" class="alert alert-danger"';
									failedHtml = failedHtml
											+ 'style="position:fixed;top:5%;text-align:center;padding:5px;';
									failedHtml = failedHtml
											+ 'margin-left:25%;width:50%;z-index: 9999">';
									failedHtml = failedHtml
											+ 'Transaction was not successufull. Please Contact Support.!';
									failedHtml = failedHtml + '</div>';
									$('body').append(failedHtml);
									var error = data.result.errors.toString().replace('s:','');
									var errorMessage = "";
									$('#alert-message').html(error);
									failedHtml = '<a href="#" class="close" data-dismiss="alert">';
									failedHtml = failedHtml + ' &times; </a>';
									$('#alert-message').append(failedHtml)

									isTransactionComplete = true;
									setTimeout(self.checkTransactionStatus,
											1000, transactionRefNo,
											isTransactionComplete, self);
									//setTimeout(function(){$('#alert-message').remove();},5000);

								}
								if (data.result.transactionStatus == "Success") {
									isTransactionComplete = true;

									if (self.options.successMsg != null) {
										var successHtml = '<div id ="alert-message" class="alert alert-success"';
										successHtml = successHtml
												+ 'style="position:fixed;top:5%;text-align:center;padding:5px;';
										successHtml = successHtml
												+ 'margin-left:25%;width:50%;z-index: 9999">';
										successHtml = successHtml
												+ self.options.successMsg;
										successHtml = successHtml + '</div>';
										
										successHtml = '<a href="#" class="close" data-dismiss="alert">';
										successHtml = successHtml
												+ ' &times; </a>';
										if(self.options.showSuccessMsg){
										  $('body').append(successHtml);
										  $('#alert-message').append(successHtml);
										}
										setTimeout(function(){$('#alert-message').remove();},5000);

									}

									self.options.transactionStatus = true;
									self.options.primaryKey=data.result.operationIdentifier;
									setTimeout(self.checkTransactionStatus,
											1000, transactionRefNo,
											isTransactionComplete, self);

								} else {
									setTimeout(self.checkTransactionStatus,
											1000, transactionRefNo,
											isTransactionComplete, self);

								}

							}).fail(function() {
				               self.options.transactionStatus = false;
				               self.endTransaction();
				            });
		} else {
			self.endTransaction();
		}
	};

	this.endTransaction = function() {
		if (this.options.viamagusloader) {
			this.options.viamagusloader.remove();
		}
		if (this.options.callback) {
            if (this.options.transactionStatus) {
                this.options.callback(this.response,this.options.primaryKey);
            }
        }
        if (this.options.errorCallBack && this.options.viamagusloader) {
            if (!this.options.transactionStatus) {
                this.options.errorCallBack(this.response);
            }
        }
	};

	this.startTransaction();
}
