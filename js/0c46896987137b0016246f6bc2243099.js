var Viamagus_Website_Loader =  {
	outerWidth:$(window).outerWidth(),
	outerHeight:$(window).outerHeight(),
    _twitterFeeds:[],
    _twitterTimeOut:'',
    _twitterLastPublishId:'',
    _ecomProductList:[],
	_init : function(options){
		this._sendSupportEmail();
		this._enableLazyloadImages({siteBuilder:false});
		this._loadBlogPosts({siteBuilder:false});  
	    this._loadGallery();
		this._loadGoogleMap();
		this._loadMultipleGoogleMapLocations();
		//this._loadTimeline();
		this._loadCarousel();
		this._loadCustomerMessages();
		this._loadViaBkgImage();
		this._setHeroImageAspectRatio();
		this._loagGridGallery(true);
		this._loadViamagusBackgroundImages();
		this._loadViamagusAnimation({duration:'4s'});
	    this._enableLightBoxForImages();
		this._enableLightBoxForVideos();
		this._setHeroSectionAsCover({siteBuilder:false});
		this._setCarouselSectionAsCover({siteBuilder:false});
		this._loadClientsList();
		this.updateMenuLinksForBlogOrProductPagePage();
		this._loadBackgroundVideo();
		this._applyFormLayout({siteBuilder:false});
		this._loadSocialFeeds({siteBuilder:false});
		this._applyEqualHeightSplitLayout();
		this._mobilePaddingHandler();
		this._applyEqualHeightCustomForm();
		this._applyParallaxForHeroSection();
		this._coverPagePullDownArrowHandler();
		this.initUpdatesTicker();
		this._loadSlickGallery();
		this._setSlickGallerySectionAsCover({siteBuilder:false});
		var that = this;
	/*	$(window).on('resize', function(event) {
			event.preventDefault();
			that._setHeroImageAspectRatio();
		});*/
		this._loadEcommProductList();
		this._customizeViamagusButtonClickEvent();
		this._enableCollapsableSections();
		this._setFooterAsSticky();
		this._initSocialSharePlugin();
		this._initAudioPlugin();
	},
	_loadViamagusAnimation:function(options){
      if($(window).outerWidth()>1024){
	    new WOW(options).init();
	  }
    },
    _loadViamagusBackgroundImages:function(){
	   $(".viamagus-background").each(function(index, e) {
	   	     $(e).css({"background":""});
			 $(e).backstretch($(e).attr("data-bkg-image"));
	    });
	},
	_loagGridGallery:function(initLightBox){
		var that = this;
		if($(".viamagus-grid-gallery").length){
		// init
		$(".viamagus-grid-gallery").each(function(index, e) {
			var layoutMode= $(e).attr('data-layoutMode');
			var noOfColumns = Number($(e).attr('data-noOfColumns'));
			var noOfColumnsMobile = 1;
			
			var imageMargin = Number($(e).attr('data-imageMargin'));
			var squareThumb = $(e).attr('data-square-thumb');
			var id= $(e).attr("data-component-id");
			if(id!=null && id!="" && id!='undefined'){
			 
			  $('#'+id).show();
			}
			if(initLightBox){
				if($(window).outerWidth()<1024){
					if(noOfColumns>2){
						noOfColumns =2;
					}
				}
				if($(window).outerWidth()<800){
					if(noOfColumns>1){
						noOfColumns =1;
					}
					if($(e).attr('data-noOfColumns-mobile')!=null && $(e).attr('data-noOfColumns-mobile')!="" && $(e).attr('data-noOfColumns-mobile')!='undefined'){
					  noOfColumnsMobile = Number($(e).attr('data-noOfColumns-mobile'));
					  if(noOfColumnsMobile!=""){
					   noOfColumns =noOfColumnsMobile;
					  }
					}
					
					
				}
			}
			var itemWidth = ($(e).outerWidth()-(2*imageMargin*noOfColumns))/noOfColumns;
			var enableLightBox=$(e).attr('data-enable-lightbox');
			/*on click of image popup*/
			var enablePopupOnImgClick=$(e).attr('data-item-info-popup');
			var columnWidth=itemWidth+2*imageMargin;
			$.each($(e).children('.viamagus-grid-item'),function(index,item){
				$(item).css({width:itemWidth+"px"});
				if(squareThumb=="true"){
					$(item).css({width:itemWidth+"px",height:itemWidth+"px"});
					if($(item).find('#mask').length){
						$(item).find('#mask').css({height:itemWidth+"px"})
					}
				}
				that.readjustVideoPlayIcon($(item));
			});
			var cellH=10;
			if(layoutMode=='masonry'){
				cellH='auto';
			}
			var wall = ''
			if($(e).attr('id')!=null){
				var newId = "viamagus-grid-gallery_"+index;
				$(e).attr('id',newId);
				wall = new freewall('#'+$(e).attr('id'));
			}else{
				wall =  new freewall('.viamagus-grid-gallery');
			}
			var fixSize=null;
			if($('.temp-component .viamagus-grid-gallery').length){
				return;
			}
			wall.reset({
				selector: '.viamagus-grid-item',
				animate: true,
				gutterX:imageMargin,
				gutterY:imageMargin,
				cellW: itemWidth,
				cellH: cellH,
				delay:25,
				fixSize:1,
				onResize: function() {
					wall.fitWidth($(e).outerWidth());
				}
			});
			// caculator width and height for IE7;
			wall.fitWidth($(e).outerWidth());
			if(layoutMode=='masonry'){
				wall.container.find('.viamagus-grid-item img').load(function() {
					wall.fitWidth($(e).outerWidth());
				});
			}
			if(enableLightBox=="true" && initLightBox){
				that._enableImageGalleryLightbox ($(e));
			}else{
				/*on click of image popup*/
				if(enablePopupOnImgClick=="true"){
					that._enablePopupInfo($(e));
				}
			}
			//enable lightbox for video items
			that._enableLightBoxForVideos($(e));
		});
	}
	},readjustVideoPlayIcon:function(gridItem){
	      if(gridItem.attr('data-layout')!=null && gridItem.attr('data-layout')!=""){
						   
							var layout = gridItem.attr('data-layout');
							var defaultVideoBtnSize=50;
							var videoButton ='';
							var itemHeight=gridItem.outerHeight();
							var itemWidth=gridItem.outerWidth();
							var dataType='';
							 
							if(layout=='cart' || layout=='masonry'){
								 window.setTimeout(function(){
									 dataType =  gridItem.find('.viamagus-cart-img').attr('data-type');
									 itemHeight = gridItem.find('.viamagus-cart-img').outerHeight();
									 if(layout=='cart'){ itemHeight=itemHeight+20;}
									 if(dataType=='video')
									{
									   videoButton=  gridItem.find('.viamagus-cart-img').find('.viamagus-play-video-icon');
									   videoButton.css({left:(itemWidth-defaultVideoBtnSize)/2});
									   videoButton.css({top:(itemHeight-defaultVideoBtnSize)/2});
								
									}
								},500);
							}else{
								 dataType =  gridItem.attr('data-type');
								 if(dataType=='video')
								 {
									   videoButton=  gridItem.find('.viamagus-play-video-icon');
								 videoButton.css({left:(itemWidth-defaultVideoBtnSize)/2});
								 videoButton.css({top:(itemHeight-defaultVideoBtnSize)/2});
								 }
								 
							}
							  

						  }
	},_enableImageGalleryLightbox:function(container){
		container.magnificPopup({
			delegate: 'a',
			type: 'image',
			tLoading: 'Loading image #%curr%...',
			mainClass: 'mfp-img-mobile',
			gallery: {
				enabled: true,
				navigateByImgClick: true,
				preload: [0,1] // Will preload 0 - before current, and 1 after the current image
			},
			image: {
				tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
				titleSrc: function(item) {
					return item.el.attr('title');
				}
			}
		});
	
	},_enablePopupInfo: function(container){
		container.find('.viamagus-grid-item').each(function(index,gridItem){
			var imgDescBgColor=$(gridItem).find('.imgDescBgColor').attr('data-image-desc-background-color');
   			var imageTitle = $(gridItem).find('h4').html();
			var fontfamily = $(gridItem).attr("data-font-style");
   			if(imageTitle!=null && imageTitle!=''){
   				imageTitle = '<div class="modal-header" style="padding: 0px; border-bottom: 0;"><h3><span style="padding: 0.3em;">'+imageTitle+'</span></h3></div><div class="modal-body" style="padding: 1.3em;">';
   			}else{
   				imageTitle = '<div class="modal-header" style="padding: 0px;border-bottom: 0;"></div><div class="modal-body" style="padding: 1.4em;">';
   			}
   			var imageDesc = $(gridItem).find('.viamagus-paragraph').html();
   			var imageSrc  = $(gridItem).find('img').attr('src');
   			$(gridItem).find('a').unbind();
            $(gridItem).find('a').click(function(e){
       			e.preventDefault();
    			//TODO build proper modal html
    			var popupHtml = '<div id="gridInfoPopup" style="'+fontfamily+'" class="md-modal md-effect-1"><div class="md-content" style="background:'+imgDescBgColor+'">'+imageTitle+'<img src='+imageSrc+' alt="Image" style="float: left;margin-right: 10px;margin-top: 7px; width:40%; max-width:40%"><p>'+imageDesc+'</p></div><div class="modal-footer" style="border-top:0px;box-shadow:0 0 0;text-align: center;border-radius:0px;background:rgba(0,0,0,0)"><button  class="btn-close" data-dismiss="modal" aria-hidden="true">Close</button></div></div></div>';
    			if($('#gridInfoPopup').length>0){
      				$('#gridInfoPopup').remove();
    			}
    			$('body').append(popupHtml);
                $('#gridInfoPopup').modal('show');
   			});

			if($(gridItem).find('a').length==0){
   				$(gridItem).find('img').unbind();
	            $(gridItem).find('img').click(function(e){
	       			e.preventDefault();
	    			//TODO build proper modal html
	    			var popupHtml = '<div id="gridInfoPopup" class="md-modal md-effect-1"><div class="md-content" style="background:'+imgDescBgColor+'">'+imageTitle+'<img src='+imageSrc+' alt="Image" style="float: left;margin-right: 10px;margin-top: 7px; width:40%; max-width:40%"><p>'+imageDesc+'</p></div><div class="modal-footer" style="border-top:0px;box-shadow:0 0 0;text-align: center;border-radius:0px;background:rgba(0,0,0,0)"><button  class="btn-close" data-dismiss="modal" aria-hidden="true">Close</button></div></div></div>';
	    			if($('#gridInfoPopup').length>0){
	      				$('#gridInfoPopup').remove();
	    			}
	    			$('body').append(popupHtml);
	                $('#gridInfoPopup').modal('show');
	   			});
   			}

  		});
	},_enableLightBoxForVideos:function(container){
		$('.viamagus-grid-video-lightbox').magnificPopup({
			  type:'iframe'
		});
	
	},_enableLightBoxForImages:function(container){
		$('.viamagus-image-lightbox').magnificPopup({
			  type:'image'
		});
	
	},_setHeroImageAspectRatio:function(){
		
	    if($(".viamagus_landimg").length){
			$(".viamagus_landimg").each(function(index, e) {
				if($(e).attr("data-img-uri")!=""){
					if($(window).outerWidth()<800){
						$(e).backstretch($(e).attr("data-img-uri"));
					}
				}
				if($(e).attr("data-portrait-img-uri")!=""){
					if($(window).outerWidth()<$(window).outerHeight() && $(window).outerWidth()<800){
						$(e).backstretch($(e).attr("data-portrait-img-uri"));
					}
				}
			});
	    }
	    if($(".viamagus_txt-slide").length){
			if($(".viamagus_txt-slide").attr("data-bkg-img")!=""){
				if($(window).outerWidth()<800){
					$(".viamagus_txt-slide").children("#magus-carousel").backstretch($(".viamagus_txt-slide").attr("data-bkg-img"));
				}
			}
	    }
	},_setHeroSectionAsCover: function(options) {
	var that = this;
	
	$(".viamagus_landimg").each(function(index, e) {
		if ($(e).attr("data-bkg-as-cover") != "" && $(e).attr("data-bkg-as-cover") == "true") {
			$(e).css({
				height: $(window).outerHeight()
			});
			if ($(e).find('.displayTableCell').length) {
				$(e).find('.displayTableCell').css({
					height: $(window).outerHeight()
				});
			} else {
				$(e).find('.box-video').css({
					height: $(window).outerHeight()
				});
			}
			if ($('#viamagusParallaxCss').length) {
				$('#viamagusParallaxCss').remove();
			}
			$('head').append("<style id='viamagusParallaxCss'>.viamagus_landimg:before{height:" + $(window).outerHeight() + "px; }</style>");
			if (!options.siteBuilder) {

				if ($(e).prev().length && $(e).prev().prop('class').indexOf('viamagus_header') != -1) {
					var style = $(e).attr("style");
					var menuOffSetTop = $('.viamagus_header').offset().top;
					if(menuOffSetTop==0){
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
					}else{
						style = style;
					}
					$(e).attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						$(e).css({
							position: 'relative'
						});
						$(e).css({
							"z-index": '0'
						});
						var style = $(e).attr("style");
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important";
						$(e).attr("style", style);
					});
				}
				if ($(e).next().length && $(e).next().prop('class').indexOf('viamagus_header') != -1) {
					var style = "";
					if ($(e).next().attr("style")) {
						style = $(e).next().attr("style");
					}
					style = style/* + "margin-top:-" + $('.viamagus_header').height() + "px !important"*/;
					$(e).next().attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						$(e).css({
							position: 'relative'
						});
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important";
						$(e).css({
							"z-index": '0'
						});
						$(e).next().attr("style", style);
					});
				}
				that.registerWindowScrollEventForCoverWebsites();
			} else {
				
				if ($(e).parent().prev().find(".viamagus_header").length && $(e).parent().prev().find(".viamagus_header").prop('class').indexOf('viamagus_header') != -1) {
					$(e).css({
						position: 'relative'
					});
					$(e).css({
						"z-index": '0'
					});
					var style = $(e).attr("style");
					style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important";
					$(e).attr("style", style);
				}
			}
		}
	});
	// setting hero section as cover first
	that._setActiveMenuLink();
        
},registerWindowScrollEventForCoverWebsites:function(){
	   var enableTransparentmenuoncovermode = $('.viamagus_header .navbar-inner').attr("data-transparent-menu-cover-mode");
	   var menuOffSetTop = $('.viamagus_header').offset().top;
	   var navStyle  = $('.viamagus_header').attr('style');
	   if(navStyle==undefined){
	   	  navStyle = '';
	   }
	   $(window).scroll(function() {
	   		var scrollTop = $( window ).scrollTop();
			var bkgcolor = $('.viamagus_header .navbar-inner').attr("data-bkg-color");
			if($('.viamagus_header').attr("data-sticky-header") && $('.viamagus_header').attr("data-sticky-header")=="true" && menuOffSetTop > 0){
				if((scrollTop+$('.viamagus_header').height())>=menuOffSetTop){
					$('.viamagus_header').attr('style','position:fixed;top:0;width:100%;z-index:1010');
				}else{
					/*navStyle = navStyle+"top:"+menuOffSetTop+'px;';*/
					$('.viamagus_header').attr('style',navStyle);
				}
			}
			if(scrollTop < $('.viamagus_header').height())
			{
				if(enableTransparentmenuoncovermode!="" && enableTransparentmenuoncovermode=="true"){
					if ($('.viamagus_header .viamagus-component-bg-colour').length) {
						$('.viamagus_header .viamagus-component-bg-colour').css({background:'rgba(0,0,0,0)'});
					} else {
						$('.viamagus_header .navbar-inner').css({background:'rgba(0,0,0,0)'});
					}
				}
			}else{
				if ($('.viamagus_header .viamagus-component-bg-colour').length) {
					$('.viamagus_header .viamagus-component-bg-colour').css({background:bkgcolor});
				} else {
					$('.viamagus_header .navbar-inner').css({background:bkgcolor});
				}
			}
		});
		if(enableTransparentmenuoncovermode!="" && enableTransparentmenuoncovermode=="true"){
			if ($('.viamagus_header .viamagus-component-bg-colour').length) {
				$('.viamagus_header .viamagus-component-bg-colour').css({background:'rgba(0,0,0,0)'});
			} else {
				$('.viamagus_header .navbar-inner').css({background:'rgba(0,0,0,0)'});
			}
		    if($(window).outerHeight()<800){
		    	
			    $('.viamagus_header .nav-collapse').css({background:$('.viamagus_header .navbar-inner').attr("data-bkg-color")});
			}
		}
		
},_setActiveMenuLink:function(){
   var documentUrl = document.URL;
   var urlContent =  document.URL.split('/');
   var pageName='home.html';
   var enableOnePageNav= false;
  
   var sectionName ='';
   	if($('.viamagus_header').attr("data-sticky-header") && $('.viamagus_header').attr("data-sticky-header")=="true"){
    	var menuOffSetTop = $('.viamagus_header').offset().top;
   	   	if(menuOffSetTop==0){
       		$('.viamagus_header').addClass("viamagus-sticky-header");
 			if($('.viamagus_header').is(':visible')){
				$('.viamagus_header .brand').find('img').load(function(){
					$('body').css({"padding-top":$('.viamagus_header').height()});
				});
				$('body').css({"padding-top":$('.viamagus_header').height()});
			}
       	}	       	   
   	}
    window.setTimeout(function(){
	   for(var i in urlContent){
			if(urlContent[i].search('.html')!=-1 && urlContent[i].indexOf('#')==-1){
				pageName = urlContent[i];
			}
			if(urlContent[i].indexOf('#')!=-1){
				pageName = "home.html";
				if(urlContent[i].search('.html')!=-1){
				  pageName =urlContent[i].split('#')[0];
				  if(urlContent[i].split('#')[1]!=null && urlContent[i].split('#')[1]!="" && $('#'+urlContent[i].split('#')[1]).length){
					var offset = $('#'+urlContent[i].split('#')[1]).offset().top-$('.viamagus_header').height();
					sectionName = urlContent[i].split('#')[1];
					   $('html, body').animate({
							scrollTop: offset
						}, 1500, 'swing', null);
				   }
				}
				else{
                 	if(urlContent[i]!=null && urlContent[i]!="" && $(urlContent[i]).length){
					var offset = $(urlContent[i]).offset().top-$('.viamagus_header').height();
					   $('html, body').animate({
							scrollTop: offset
						}, 1500, 'swing', null);
				   }			
				}

			}
		}
		if($('.viamagus_header').length && pageName!=''){
			$('.viamagus_header').find('ul').find('li.active').removeClass('active');
			$.each($('.viamagus_header').find('ul').find('li'),function(index,link){
				var linkTarget = $(link).find('a').attr('href');
				if(linkTarget.indexOf('#')!=-1){
					var linkName = linkTarget.split('#');
					var linkPageName=linkName[0];
					var linkSectionName=linkName[1];
					if(linkPageName==pageName){
						$(link).find('a').attr('href',"#"+linkSectionName);
						enableOnePageNav= true;
					}else{
						$(link).children('a').addClass('external');
					}
				}else{
					$(link).children('a').addClass('external');
				}
				 if($(link).hasClass('dropdown')){
				   $.each($(link).find('ul').find('li'),function(index,sublink){
					 var sublinkTarget = $(sublink).find('a').attr('href');
						if(sublinkTarget==pageName){
							$(link).addClass('active');
						}	
				   });
				 }

				if(linkTarget==pageName || (pageName=='home.html' && linkTarget=='/')){
					$(link).addClass('active');
				}
			});
		}
    	if(enableOnePageNav){
			var navBarHeight = $('.viamagus_header').height();
			$('.viamagus_header').onePageNav({
				currentClass: 'active',
				changeHash: false,
				scrollSpeed: 1000,
				scrollThreshold: 0.5,
				filter: ':not(.external)',
				navBarHeight: navBarHeight
			});
		}
	},100);
	/*window.setTimeout(function(){
	  if(sectionName!='')
	   if(window.scrollY!=$('#'+sectionName).offset().top){
	   $('html, body').animate({
							scrollTop: $('#'+sectionName).offset().top
						}, 100, 'swing', null);
	   }
	
	},100);*/

	$('.viamagus_header ul li.dropdown .menulink').unbind();
	$('.viamagus_header ul li.dropdown .menulink').click(function(e){
	    var openDropDown = $('.viamagus_header ul li.dropdown.open');
		window.setTimeout(function(){
		  openDropDown.addClass('active');
		},750);
		if($(e).attr("href")!=-1){
		   var urlLinkVal= $(this).attr("href");
	       var offset = $('#'+urlLinkVal.split('#')[1]).offset().top-$('.viamagus_header').height();
			   $('html, body').animate({
					scrollTop: offset
				}, 1000, 'swing', null);
		}

	});
},_loadViaBkgImage:function(){
	if (typeof(loadViaBkgImage) === "function") {
					if(loadViaBkgImage){
						  loadViaBkgImage();
					}
	}
},_loadCarousel:function(options){
	$(".carousel").each(function(index, e) {
     if($(e).attr("data-interval")!=""){
     	var dataInterval= $(e).attr("data-interval");
     	$(e).carousel({interval:dataInterval});
     }
 });
},_setCarouselSectionAsCover: function(options) {
	var that = this;
	$(".carousel").each(function(index, e) {
		if ($(e).attr("data-bkg-as-cover") != "" && $(e).attr("data-bkg-as-cover") == "true") {
			$(e).css({
				height: $(window).outerHeight()
			});
			$(e).find('.carousel-img').each(function(index2, img) {
				$(img).css({
					height: $(window).outerHeight()
				});
			});
			$(e).find('.slider-text-center-text').css({
				height: $(window).outerHeight()
			});
			if (!options.siteBuilder) {
				var carouselComponent;
				if($(e).parent().hasClass('viamagus-component-content')){
					carouselComponent = $(e).parent().parent().parent();	
				}else{
					carouselComponent = $(e).parent();
				}
				if (carouselComponent.prev().length && carouselComponent.prev().prop('class').indexOf('viamagus_header') != -1) {
					var style='';
					var initialStyle='';
					if(carouselComponent.attr("style")==undefined){
						style = '';
					}else{
						style = carouselComponent.attr("style");
						initialStyle =carouselComponent.attr("style");
					}
					var menuOffSetTop = $('.viamagus_header').offset().top;
					if(menuOffSetTop<=50){
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
					}else{
						style = style;
					}
					$(window).scroll(function() {
		    			var scrollTop = $( window ).scrollTop();
		    			var style = '';
		    			if(scrollTop < $('.viamagus_header').height()){
		    				style = initialStyle + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
	    					carouselComponent.attr("style", style);
		    			}
					});
					carouselComponent.attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						carouselComponent.css({
							position: 'relative'
						});
						carouselComponent.css({
							/*"z-index": '-1'*/
						});
						var style = carouselComponent.attr("style");
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important";
						carouselComponent.attr("style", style);
					});
				}
				if (carouselComponent.next().length && carouselComponent.next().prop('class').indexOf('viamagus_header') != -1) {
					var style = "";
					if (carouselComponent.next().attr("style")) {
						style = carouselComponent.next().attr("style");
					}
					style = style/* + "margin-top:-" + $('.viamagus_header').height() + "px !important;margin-bottom:"+ $('.viamagus_header').height() + "px"*/;
					carouselComponent.next().attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						carouselComponent.css({
							position: 'relative'
						});
						
						carouselComponent.css({
							/*"z-index": '-1'*/
						});
						carouselComponent.next().attr("style", style);
					});
				}
				that.registerWindowScrollEventForCoverWebsites();
			} else {
				var sitebuildercarouselcomponent;
				if($(e).parent().hasClass('viamagus-component-content')){
					sitebuildercarouselcomponent = $(e).parent().parent().parent();	
				}else{
					sitebuildercarouselcomponent = $(e).parent();
				}
				if (sitebuildercarouselcomponent.parent().prev().find(".viamagus_header").length && sitebuildercarouselcomponent.parent().prev().find(".viamagus_header").prop('class').indexOf('viamagus_header') != -1) {
					sitebuildercarouselcomponent.css({
						position: 'relative'
					});
					sitebuildercarouselcomponent.css({
						/*"z-index": '-1'*/
					});
					var style = sitebuildercarouselcomponent.attr("style");
					style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
					sitebuildercarouselcomponent.attr("style", style);
				}
			}
		}
	});
},_loadGallery:function(options){
		if($('.galleria').length){

			    var thumbnails= ($('.galleria').attr("data-thumbnails")=='true'?true:false);
				var autoplay= ($('.galleria').attr("data-autoplay")=='true'?5000:false);
				var imageCrop= $('.galleria').attr("data-imageCrop");
				var height= $('.galleria').attr("data-gallerySize");
				
				//Galleria.loadTheme('/static/sitebuilder/js/themes/classic/galleria.classic.min.js');
				Galleria.configure({
					transition: 'fade',imageCrop:imageCrop
				});
				Galleria.run('.galleria', {
					  height:height,
					  autoplay: autoplay,
                       
                      thumbnails:thumbnails,
					  responsive:true,
					  showCounter:true,
					  trueFullscreen:true,
                      debug:false,
	                  showInfo:false 
                       
			  
				});
		}
	},
    _loadGoogleMap:function(){
		var googleMapStyles = {
			"default":"",
		   "lightgrayscale":[{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}],
           "lightmonochrome":[{"featureType":"water","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":-78},{"lightness":67},{"visibility":"simplified"}]},{"featureType":"landscape","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"hue":"#e9ebed"},{"saturation":-90},{"lightness":-8},{"visibility":"simplified"}]},{"featureType":"transit","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":10},{"lightness":69},{"visibility":"on"}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"hue":"#2c2e33"},{"saturation":7},{"lightness":19},{"visibility":"on"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":-2},{"visibility":"simplified"}]}],
			"darkgrayscale":[{"featureType":"all","stylers":[{"saturation":-100},{"gamma":0.5}]}],
			"applemapsque":[{"featureType":"water","elementType":"geometry","stylers":[{"color":"#a2daf2"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":"#f7f1df"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#d0e3b4"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#bde6ab"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.business","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe15f"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efd151"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"black"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#cfb2db"}]}],
			"lunarlandscape":[{"stylers":[{"hue":"#ff1a00"},{"invert_lightness":true},{"saturation":-100},{"lightness":33},{"gamma":0.5}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#2D333C"}]}],
            "icyblue":[{"stylers":[{"hue":"#2c3e50"},{"saturation":250}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":50},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]}],
            "redhues":[{"stylers":[{"hue":"#dd0d0d"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]}],
            "turquoisewater":[{"stylers":[{"hue":"#16a085"},{"saturation":0}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]}],
            "blueessence":[{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill"},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#7dcdcd"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]}],
			"illustrao":[{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#71ABC3"},{"saturation":-10},{"lightness":-21},{"visibility":"simplified"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"hue":"#7DC45C"},{"saturation":37},{"lightness":-41},{"visibility":"simplified"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#C3E0B0"},{"saturation":23},{"lightness":-12},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#A19FA0"},{"saturation":-98},{"lightness":-20},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#FFFFFF"},{"saturation":-100},{"lightness":100},{"visibility":"simplified"}]}],
			   
			   
		};
		if(document.getElementById('map_canvas')){
			var latLng = new google.maps.LatLng(12.969431,77.600845);
			var latLngJson = $('#latLng').html();
			
			if(latLngJson!=""){
				latLng = JSON.parse(latLngJson);
				var newArray = [];

				for (var key in latLng) {

				   newArray.push(key);

				}
				
				latLng = new google.maps.LatLng(latLng[newArray[0]],latLng[newArray[1]]);
				
				
			}
			var defaultZoom = 9;
			if($('#addressPickerZoom')!=null && eval($('#addressPickerZoom').val())>0){
				defaultZoom = Math.floor($('#addressPickerZoom').val());
			}


         var contentString = '<div id="infoWindowContent"> '+$('#customerAddress').text()+'  </div>'
		  var infowindow = new google.maps.InfoWindow({
			  content: contentString,
			   maxWidth: 200
		  });
			var mapstyle='';
            if($('#map_canvas').attr("data-google-map-style")!=""){
			  mapstyle=googleMapStyles[$('#map_canvas').attr("data-google-map-style")];
			}
			var map = new google.maps.Map(document.getElementById('map_canvas'), {
					zoom: defaultZoom,
					center: latLng,
					mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles:mapstyle,scrollwheel:false
				 });
			var marker = new google.maps.Marker({
                position: latLng,
                map: map
            });
			
			 google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(map,marker);
			 });
			 infowindow.open(map,marker);
			
	   }
	},_loadMultipleGoogleMapLocations:function(){

        var that =this;
        var googleMapStyles = {
			"default":"",
		   "lightgrayscale":[{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}],
           "lightmonochrome":[{"featureType":"water","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":-78},{"lightness":67},{"visibility":"simplified"}]},{"featureType":"landscape","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"hue":"#e9ebed"},{"saturation":-90},{"lightness":-8},{"visibility":"simplified"}]},{"featureType":"transit","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":10},{"lightness":69},{"visibility":"on"}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"hue":"#2c2e33"},{"saturation":7},{"lightness":19},{"visibility":"on"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":-2},{"visibility":"simplified"}]}],
			"darkgrayscale":[{"featureType":"all","stylers":[{"saturation":-100},{"gamma":0.5}]}],
			"applemapsque":[{"featureType":"water","elementType":"geometry","stylers":[{"color":"#a2daf2"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":"#f7f1df"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#d0e3b4"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#bde6ab"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.business","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe15f"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efd151"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"black"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#cfb2db"}]}],
			"lunarlandscape":[{"stylers":[{"hue":"#ff1a00"},{"invert_lightness":true},{"saturation":-100},{"lightness":33},{"gamma":0.5}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#2D333C"}]}],
            "icyblue":[{"stylers":[{"hue":"#2c3e50"},{"saturation":250}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":50},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]}],
            "redhues":[{"stylers":[{"hue":"#dd0d0d"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]}],
            "turquoisewater":[{"stylers":[{"hue":"#16a085"},{"saturation":0}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]}],
            "blueessence":[{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill"},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#7dcdcd"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]}],
			"illustrao":[{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#71ABC3"},{"saturation":-10},{"lightness":-21},{"visibility":"simplified"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"hue":"#7DC45C"},{"saturation":37},{"lightness":-41},{"visibility":"simplified"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#C3E0B0"},{"saturation":23},{"lightness":-12},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#A19FA0"},{"saturation":-98},{"lightness":-20},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#FFFFFF"},{"saturation":-100},{"lightness":100},{"visibility":"simplified"}]}],
			   
			   
		}

		if($(".viamagus-google-map").length>0){
         $(".viamagus-google-map").each(function(index, e) {
			var latLng = new google.maps.LatLng(12.969431,77.600845);
			var latLngJson = $(e).find('.viamagus-google-latlng').html();
			var defaultZoom = 9;
			if($(e).find('.viamagus-google-mapzoom')!=null && eval($(e).find('.viamagus-google-mapzoom').val())>0){
				defaultZoom = Math.floor($(e).find('.viamagus-google-mapzoom').val());
			}
			
			 var contentString = '<div id="infoWindowContent"> '+$(e).find('.viamagus-google-address').text()+'  </div>'
			  var infowindow = new google.maps.InfoWindow({
				  content: contentString,
				   maxWidth: 300
			  });


			if(latLngJson!=""){
				latLng = JSON.parse(latLngJson);
				var newArray = [];
				for (var key in latLng) {
				   newArray.push(key);
				}				
				latLng = new google.maps.LatLng(parseFloat(latLng[newArray[0]]),parseFloat(latLng[newArray[1]]));
			}
			var mapstyle='';
            if($(e).attr("data-google-map-style")!=""){
			  mapstyle=googleMapStyles[$(e).attr("data-google-map-style")];
			}
			var map = new google.maps.Map($(e).find('.viamagus-google-map-canvas')[0], {
					zoom: defaultZoom,
					center: latLng,
                    styles:mapstyle,scrollwheel:false
				 });
			var marker = new google.maps.Marker({
                position: latLng,
                map: map
            });
			
			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(map,marker);
			 });
			 infowindow.open(map,marker);
			 that.registerShowDirections();
		});	
	   }
	},_loadTimeline:function(){
	   if($('#default-timeline').length){ 
		   var str = $('#default-timeline').html();
		   str =  str.replace(/\r\n?|\n/g, '');
		   var timelineJSON = JSON.parse(str);
	        createStoryJS({
                    type:       'timeline',
                    width:      '100%',
                    height:     '600',
                    source:     timelineJSON,
                    embed_id:   'valentine-timeline'
                });
		 }
	
	},_sendSupportEmail:function(){
	  $('.form-horizontal')
					.each(
							function(index, e) {
			  var className = $(e).attr('class');
			  if(className.indexOf('viamagus-custom-form')==-1){
			    
			  $(e).submit(function( event ) {
					   
				   event.preventDefault();
				  var customerName= document.getElementById('customerName').value;
				  var customerEmail=document.getElementById('customerEmail').value;
				  var customerMessage='';
				  if(document.getElementById('customerMessage')){
					 customerMessage= document.getElementById('customerMessage').value;
				  }
				  var customerPhone='';
				  if(document.getElementById('customerPhone')){
					 customerPhone = document.getElementById('customerPhone').value;
				  }
				  var isValidEntry = false;
				  if(document.getElementById('customerEmail').value!='' || document.getElementById('customerPhone').value!=''){
				      isValidEntry = true;
				  }
				  if ($('.contact-email .viamagus-phone').length && !$('.contact-email .viamagus-phone').intlTelInput("isValidNumber")) {
				    alert("Please enter valid phone no.");
					return;
				  }
				  if(!isValidEntry){
				    alert("Please enter your email or phone no.");
					return;
				  }
				  $.ajax({
						url : '/REST/general/customerEmail/',
						type : 'POST',
						data : {
							format : 'json',
							customerName :customerName,
							customerEmail :customerEmail,
							customerMessage: customerMessage,
							customerPhone : customerPhone,
							websiteUrl:window.location.hostname
							
						},
						dataType : 'jsonp',
						jsonp : 'jsonCallback'
					}).done(function(data) {
						//alert("Thank you for contacting us. We shall get back to you at the earliest!");
						document.getElementById('customerName').value='';
						document.getElementById('customerEmail').value='';
						if ($('.contact-email .viamagus-phone').length){
						  $('.contact-email .viamagus-phone').val('');
						}
						if(document.getElementById('customerMessage')){
						  document.getElementById('customerMessage').value='';
						}
						if(document.getElementById('customerPhone')){
							document.getElementById('customerPhone').value='';
						}
						
						var modalHtml = '<div class="modal hide fade" id ="confirmModal">';
						modalHtml = modalHtml + '<div class="modal-header" style="min-height:100px;padding:15px 20px; border:0px;">';
						modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
						modalHtml = modalHtml + '<h3 style="padding:25px 20px;font-size:18px;">Thank you for contacting us. We shall get back to you at the earliest!</h3>';
						modalHtml = modalHtml + '</div>';
						modalHtml = modalHtml + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="background-color: #2167FF;color:white;opacity:1;padding: 5px 10px;font-size: 14px;margin:20px;">OK</button>';
						modalHtml = modalHtml + '</div>';
						$('body').append(modalHtml);
						$('#confirmModal').modal('show');
						
					});
						  
					

			  });
			  
			  }
		});
	

	  
	
	},_loadCustomerMessages:function(){
	  	  
		  if($('#vmSmsUpdatesBoard').length){ 
		  $.ajax({
				url : '/REST/general/loadCustomerMsg',
				data : {
					format : 'json'					
				},
				dataType : 'jsonp',
				jsonp : 'jsonCallback'
			}).done(function(data) {
				if(data.result.length==0){
				  $('#vmSmsUpdatesBoard').toggle();
				  return;
				}
				var defaultMessage = '';
				for (var i=data.result.length ;i>data.result.length-1 ;i-- )
				{
				   
				   defaultMessage = defaultMessage+ ' <li id="latestMessage">';
				   defaultMessage = defaultMessage+ ' <div class="vm-text-update-badge danger"><i class="glyphicon icon-comment"></i></div>';
				   defaultMessage = defaultMessage+ ' <div class="vm-text-update-panel">';
				   defaultMessage = defaultMessage+ ' <div class="vm-text-update-heading">';
				   defaultMessage = defaultMessage+ ' <p><small class="text-muted"><i class="glyphicon icon-time"></i> '+data.result[i-1].msgAge+' via SMS</small></p>';
				   defaultMessage = defaultMessage+ ' </div>';
				   defaultMessage = defaultMessage+ ' <div class="vm-text-update-body">';
				   defaultMessage = defaultMessage+ ' <p> '+data.result[i-1].msg+' </p>';
				   defaultMessage = defaultMessage+ ' <hr>';
				   defaultMessage = defaultMessage+ ' <div id="loadMoreMessages" class="oldupdates">';
				   defaultMessage = defaultMessage+ ' <a  href="javascript:Viamagus_Website_Loader.showOlderMessages();"> Click To Load Older Updates</a>';
				   defaultMessage = defaultMessage+ ' </div></div></div></li>';
						
				}
				$('#vmSmsUpdatesBoard').find('ul').empty();
				$('#vmSmsUpdatesBoard').find('ul').append(defaultMessage);
				$('#vmSmsUpdatesBoard').append('<ul class="vm-text-update" id="previousMessageCollection" style="display:none" ></ul>');
				var  otherMessage = '';
				for (var i=data.result.length-1 ;i>0 ;i-- )
				{
				   
				   otherMessage = otherMessage+ ' <li>';
				   otherMessage = otherMessage+ ' <div class="vm-text-update-badge danger"><i class="glyphicon icon-comment"></i></div>';
				   otherMessage = otherMessage+ ' <div class="vm-text-update-panel">';
				   otherMessage = otherMessage+ ' <div class="vm-text-update-heading">';
				   otherMessage = otherMessage+ ' <p><small class="text-muted"><i class="glyphicon icon-time"></i> '+data.result[i-1].msgAge+' via SMS</small></p>';
				   otherMessage = otherMessage+ ' </div>';
				   otherMessage = otherMessage+ ' <div class="vm-text-update-body">';
				   otherMessage = otherMessage+ ' <p> '+data.result[i-1].msg+' </p>';
				   otherMessage = otherMessage+ ' <hr></div></div></li>';
						
				}
				$('#previousMessageCollection').append(otherMessage);
				  
			});
	
		  }
	  
	
	},showOlderMessages:function(){
    	$('#previousMessageCollection').toggle();
	},_loadBlogPosts:function(options){
	  	  
		  if($(".vm-blog").length){
			  var url= '';
			 // this.updateMenuLinksForBlogPage();
			  if(options.siteBuilder){
			     url= '/console/REST/blog/loadPost';
			  	  var that  = this;
				  var blogId= $(".vm-blog").attr("data-blog-id");
				  if(blogId!=""){
					  $.ajax({
							url : url,
							data : {
								blogId : blogId					
							},
							dataType : 'jsonp',
							jsonp : 'jsonCallback'
						}).done(function(data) {
							
						if(data.result && data.result.length>0){

						   $('.vm-blog-container').empty();
							
							for (var i=data.result.length ;i>0 ;i-- )
							{
							   that.populateBlogPostRow($('.vm-blog-container'),data.result[i-1]);
							}
						}
						  
					});
				}
			  }
	
		  }
	  
	
	},populateBlogPostRow:function(blogContainer,blogPost){
	  var  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	  var postDate = new Date(blogPost.postDate);
	  var blogPostHtml = '<div class="row-fluid"><div class="vm-blog-post"><div class="row-fluid">';
		 /*if(blogPost.postImageUrl && blogPost.postImageUrl!=""){
			blogPostHtml = blogPostHtml +'<div class="span12 columns"><div class="image">';
			blogPostHtml = blogPostHtml +'<a href="'+blogPost.postUrl+'" title="'+blogPost.title+'" target="_self">';
			blogPostHtml = blogPostHtml +'<img src="'+blogPost.postImageUrl+'" alt="'+blogPost.title+'"> <span class="hover"> <em>Read more </em> <i></i></span></a></div></div>';
		  }*/
		  blogPostHtml = blogPostHtml +'<div class="span12 columns"><div class="featurette"><div class="date-35pad pull-left"><div class="date">'
		  blogPostHtml = blogPostHtml +'<span class="month">'+monthNames[postDate.getMonth()]+'</span> <span class="day">'+postDate.getDate()+'</span></div><div class="post-info"><div class="category">';
		  blogPostHtml = blogPostHtml +'<a href="'+blogPost.postUrl+'" title="View all posts" rel="category tag">'+blogPost.categoryName+'</a></div></div></div>';
		  blogPostHtml = blogPostHtml +'<div class="post-content"><h1>';
		  blogPostHtml = blogPostHtml +'<a href="'+blogPost.postUrl+'" target="_self" title="blog post title">'+blogPost.title+'</a></h1>';
		  var posttext = $("<div></div>").append(decodeURIComponent(blogPost.article));
		  
		  if(blogPost.article.length>500){
			  blogPostHtml = blogPostHtml +'<div class="post-content-full formatted-content">'+posttext.text().substring(0,500)+'</div>';    
			  blogPostHtml = blogPostHtml +'<a href="'+blogPost.postUrl+'"> Read More...</a>';
		  }else{
        	  blogPostHtml = blogPostHtml +'<div class="post-content-full formatted-content">'+decodeURIComponent(blogPost.article)+'</div>';
		  }
		  blogPostHtml = blogPostHtml +'</div></div></div></div></div></div>';
          blogContainer.append(blogPostHtml);
	},updateMenuLinksForBlogOrProductPagePage:function(){
		if($(".vm-blog").length || $(".vm-product-group").length || $('.vm-product-page').length){
				 if($('.viamagus_header').length ){
				   $.each($('.viamagus_header').find('ul').find('li'),function(index,link){
					 var linkTarget = $(link).find('a').attr('href');
					 if(!$(link).find('a').attr('href').startsWith("/") && $(link).find('a').attr('href')!='/' && ($(link).find('a').attr('href').indexOf('#')==-1 || $(link).find('a').attr('href').indexOf('http')==-1)){
					    $(link).children('a').attr('href',"/"+linkTarget);
					 }
					 if($(link).find('a').attr('href').startsWith("//")){
					   $(link).children('a').attr('href',linkTarget.replace("/",""));
					 }
				   });
			   }	
		}
						
	},_loadClientsList:function(){
          if($(".viamagus-clients-list").length){
					$(".viamagus-clients-list").each(function(index, e) { 
							$(e).find('.elastislide-list').elastislide( {
								   
						   } );
					});
		  }
               
     },_loadBackgroundVideo:function(){
          if($(".viamagus-background-video-player").length){
					
			   $(".viamagus-background-video-player").mb_YTPlayer();
		  }
               
     },_enableLazyloadImages:function(options){
		   if($("img.lazy").length){
				if(options.siteBuilder){
				    $("img.lazy").show().lazyload({skip_invisible : false,threshold : 600,effect : "fadeIn",container:'.viamagusPageSettings'});
				}else{
				     $("img.lazy").show().lazyload({threshold : 900,effect : "fadeIn",container:'body'});
				  
				}
			}

			if($("div.lazy").length){
				if(options.siteBuilder){
				   $("div.lazy").show().lazyload({threshold : 600,effect : "fadeIn",container:'.viamagusPageSettings'});
				}else{
				  $("div.lazy").show().lazyload({threshold : 900,effect : "fadeIn",container:'body'});
				}
			}
               
     },_applyFormLayout:function(options){
	 
        if($('.vm-customform').length){
		  $(".vm-customform").each(function(index, e) { 
             var formLayout = $(e).attr("data-form-layout");
			 if(formLayout!=""){
			   $(e).find('.viamagus-custom-form').removeClass('form-horizontal');
			   $(e).find('.viamagus-custom-form').removeClass('form-vertical');
			   $(e).find('.viamagus-custom-form').addClass(formLayout);
			 
			 }
			 if(options.siteBuilder){
				 if($('.vmpopover').length){
					/*$(e).find('.viamagus-custom-form').removeClass('form-horizontal');
					$(e).find('.viamagus-custom-form').addClass('form-vertical');*/
				 }
			 }
		  
		   });

		}

	},
	_loadSocialFeeds:function(options){
	 	var refreshTweets ='';
		var that =this;
		that._twitterFeeds=[];
		var that= this;
		/*if($(".vm-social-wall").length){
		   $(".vm-social-wall").each(function(index, e) { 
				var obj = $(e);
				//console.log("init social feed");
				that.getSocialFeed(options,obj,false,'');
			    if(!options.siteBuilder && Viamagus_Website_Loader.outerWidth>1024){
				    obj.css({height:$(window).outerHeight()});
				}
			});
		}*/
		if($(".vm-social-wall").length){
		   $(".vm-social-wall").each(function(index, e) { 
				var obj = $(e);
				//console.log("init social feed");
				//show the twitter wall actual feeds 
				obj.find('.viamagus-social-feeds').empty();
				obj.find('.viamagus-social-feeds').show();
				that.getSocialFeed(options,obj,false,'');
			    if(!options.siteBuilder && Viamagus_Website_Loader.outerWidth>1024){
				    obj.css({height:$(window).outerHeight()});
				}
			});
		}
	},
	getSocialFeed:function(options,obj,isRefresh,lastPulledId){
	          var that = this;
			  var url= '';
			  if(options.siteBuilder){
			     url= '/console/REST/social/loadMagusPublishSocialFeed';
			  }else{
			     url= '/REST/social/loadMagusPublishSocialFeed';
			  }
				 var socialSearchId= obj.attr("data-social-search-id");
				 var refreshTime = eval(obj.attr("data-refresh-interval"))*60000; 
				// var refreshTime = 0.1*60000; 
				// alert(refreshTime);
				  if(socialSearchId!=""){
					  $.ajax({
							url : url,
							data : {
								feedId : socialSearchId,
								lastPulledId :lastPulledId	
							},
							dataType : 'jsonp',
							jsonp : 'jsonCallback'
						}).done(function(data) {
							
							if(data.result && data.result.length>0){
							  if(!isRefresh){ 
							    obj.find('.viamagus-social-feeds').empty();
							    that.buidFirstTweet(obj.find('.viamagus-social-feeds'),data);
							  }else{
							    //obj.find('.viamagus-social-feeds').empty();
							    that.buidLatestTweet(obj.find('.viamagus-social-feeds'),data);
							  }
							}
							   // load the recent tweets using lastpulledId
							   clearTimeout(that._twitterTimeOut);
							   that._twitterTimeOut = setTimeout(function(){
								   that.getSocialFeed(options,obj,true, that._twitterLastPublishId);
							   },refreshTime,options,obj,true, that._twitterLastPublishId);
							   //that.refreshSocialFeed(isRefresh);
							
						
						  
					});
				}
	
	},buidFirstTweet:function(feedObj,data){
            var that =this;
			for (var i=0;i<data.result.length ;i++ )
			{
			   var tweetObj=data.result[i];
			   that._twitterLastPublishId= tweetObj.publishId;
			   that._twitterFeeds.push(tweetObj);
			   feedObj.append(that.constructTweetHtml(tweetObj,'columngridcenter activecenter'));
			   feedObj.find(".columngridcenter").velocity("fadeIn",{ duration: 3000,complete:function(){
					         if(feedObj.find(".activecenter .vm-twitter-video").length){
							   feedObj.find(".activecenter .vm-twitter-video")[0].load();
							   feedObj.find(".activecenter .vm-twitter-video")[0].play();
							 }
                        }});
			
			}
	
	},buidLatestTweet:function(feedObj,data){
            var that =this;
			for (var i=0;i<data.result.length ;i++ )
			{
			   var tweetObj=data.result[i];
			   that._twitterLastPublishId= tweetObj.publishId;
			   that._twitterFeeds.push(tweetObj);
			   
			   that.startTwitterSlidingAnimation(feedObj,tweetObj);
			
			}
	
	},startTwitterSlidingAnimation:function(feedObj,tweetObj){
		var that =this;
	    var tweetHtml = that.constructTweetHtml(tweetObj,'columngridright activeright');
		if(that._twitterFeeds.length==2){
          //move right tweet to center
		  
	      feedObj.append(tweetHtml);
		  feedObj.find(".activeright").show();
		  feedObj.find(".activeright").velocity({scale:[0.7]},{duration:0});
		  feedObj.find(".activeright").velocity({scale:[1],left:"31.55%"},{ duration: 2000,complete:function(){
					        that.onTweetAnimationComplete(feedObj,callback);
                        }});
          feedObj.find(".activecenter").velocity({left:"0%",scale:[0.7],margin:"0%"},{ duration: 2000,complete:function(){}});
	     // $(".columngridthree").velocity({left:"35%",scale:[1.2]},{ duration: 2000});
		}else if(that._twitterFeeds.length==3){
		  feedObj.append(tweetHtml);
		  feedObj.find(".activeright").velocity("fadeIn",{ duration: 3000});		
		}else{
		  tweetHtml =that.constructTweetHtml(tweetObj,'columngridright freshTweet');
		  feedObj.append(tweetHtml);
		  var callback =function(){
 		      feedObj.find(".freshTweet").removeClass('freshTweet').addClass('activeright');
		  };
		  feedObj.find(".activeleft").velocity("fadeOut",{ duration: 2000});
		  feedObj.find(".activeright").velocity({scale:[0.7]},{duration:0});
		  feedObj.find(".activeright").velocity({scale:[1],left:"31.55%"},{ duration: 2000,complete:function(){
					     that.onTweetAnimationComplete(feedObj,callback);
                        }});
          feedObj.find(".activecenter").velocity({left:"0%",scale:[0.7],margin:"0%"},{ duration: 2000});
		  window.setTimeout(function(){
		    feedObj.find(".freshTweet").velocity("fadeIn",{ duration: 1000});
		  },1000);
		  
		}

	
	},onTweetAnimationComplete:function(feedObj,callback){
    	if(feedObj.find(".activeleft").length){
		   feedObj.find(".activeleft").remove();
		}
		feedObj.find(".activecenter").removeClass('activecenter').addClass('activeleft');
		feedObj.find(".activeright").removeClass('activeright').addClass('activecenter');
	    if(feedObj.find(".activecenter .vm-twitter-video").length){
		   feedObj.find(".activecenter .vm-twitter-video")[0].load();
		   feedObj.find(".activecenter .vm-twitter-video")[0].play();
		}
		
		if(callback){callback();}
		
	},constructTweetHtml:function(tweetObj,tweetClass){
	    var feedHtml ='';
		if(!(tweetObj.mediaImageUri!="" && tweetObj.mediaImageUri!=null)){
		   tweetClass = tweetClass+" only-text";
		}
		feedHtml = feedHtml +'<div class="'+tweetClass+' span4 vm-tweet"  style="display:none;height:100%;">';
        feedHtml = feedHtml +'<div class="twitterContainer" >';
        feedHtml = feedHtml +'<div class="row-fluid">';
		feedHtml = feedHtml +'<div class="span2">';
		feedHtml = feedHtml +'<img class="vm-twitter-profile-img" src="'+tweetObj.profileImageUri+'">';
		feedHtml = feedHtml +'</div>';
		feedHtml = feedHtml +'<div class="span8">';
		feedHtml = feedHtml +'<h2 class="vm-twitter-profile-name">'+tweetObj.userName+'</h2>';
		feedHtml = feedHtml +'<h4 class="vm-twitter-hashtag">'+tweetObj.postedBy+'</h4>';
		feedHtml = feedHtml +'</div>';
		feedHtml = feedHtml +'<div class="span2">';
		feedHtml = feedHtml +'<img class="vm-twitter-bird" src="imgs/b5721aca08135b6e061e17fae4016faa.png">';
		feedHtml = feedHtml +'</div>';
		feedHtml = feedHtml +'</div>';	 
		
		if(tweetObj.mediaImageUri!="" && tweetObj.mediaImageUri!=null){
			feedHtml = feedHtml +'<div class="vm-twitter-message">'+tweetObj.message+'</div></div>';
			feedHtml = feedHtml +'<div class="vm-twitter-media-container">';
          if(tweetObj.isVideo=="Y"){
			  feedHtml = feedHtml +'<video class="vm-twitter-video" style="width:100%;height:auto;max-height:290px;">';
			  feedHtml = feedHtml +'<source src="'+tweetObj.mediaImageUri+'" type="video/mp4">';
			  feedHtml = feedHtml +'Your browser does not support the video tag.</video>';
		  }else{
     		  //To User it as background image
			 // feedHtml = feedHtml +'<div class="vm-twitter-media-image" style="background-image:url('+tweetObj.mediaImageUri+');" \></div>';
			 feedHtml = feedHtml +'<img class="vm-twitter-media-image-contain" style="width:100%;height:300px; object-fit:contain;" src="'+tweetObj.mediaImageUri+'">';
		  }
		  feedHtml = feedHtml +'</div>';
		}else{
		 // feedHtml = feedHtml +'<div class="vm-twitter-empty-section" style="height:330px;background-color:rgba(0,0,0,0);" \></div>';
		 feedHtml = feedHtml +'<div class="vm-twitter-message" style="display:table;font-size:24px;line-height:1.3;padding-top:60px;padding-bottom:100px;"><div class="vm-tweet-text-container" style="display:table-cell;vertical-align:middle;">'+tweetObj.message+'</div></div></div>';
		}
		feedHtml = feedHtml +'</div>';
		return feedHtml;
	
	},
	refreshSocialFeed:function(isRefresh){
	  var that =this;
	  if($(".vm-social-wall").length){
			  $(".vm-social-wall").each(function(index, e) { 
			     var obj = $(e);
				 var socialFeedContainer = obj.find('.viamagus-social-feeds');
				 var animationClass= obj.attr("data-section-animation");
				 
				 if(that._twitterFeeds.length>0){
				 obj.find('.viamagus-social-feeds').empty();
				    var count = 0;
				  //console.log(" tweetfeeds length:"+that._twitterFeeds.length);
				  for(var index=that._twitterFeeds.length;index>0;index--){
					    count = count+1;
						if(count<=3){
						   that.populateSocialFeedRow(socialFeedContainer,that._twitterFeeds[index-1],animationClass,count,isRefresh);
						}
					}
					//remove oldest tweets
					//if(that._twitterFeeds.length>5){
						count = 0;
						for(var index=that._twitterFeeds.length;index>0;index--){
							count = count+1;
							if(count>3){
							  delete that._twitterFeeds[index-1];
							}
						}
					//}
					that._loadViamagusAnimation({duration:'2s'});
					that._enableLightBoxForImages();
					if(!isRefresh){
					   
					   that._loadViamagusBackgroundImages();
					}

				 }
	
			});
		  }
	  
	}
	,populateSocialFeedRow:function(socialFeedContainer,socialFeed,animationClass,index,isRefresh){
        var socialFeedRowHtml="";
		//console.log(" tweet id:"+socialFeed.publishId);
		if((index+1)%2!=0){
				socialFeedRowHtml = socialFeedRowHtml+'<div class="row-fluid '+animationClass+'">';
				socialFeedRowHtml = socialFeedRowHtml+'<div class="section-center1">';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="span12 vm-wall-bckgnd vm-wall-bckgnd1">';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="span12">';
				if(socialFeed.mediaImageUri!=null && socialFeed.mediaImageUri!=""){
					socialFeedRowHtml = socialFeedRowHtml+'		<div class="section-style1">';
					socialFeedRowHtml = socialFeedRowHtml+'	<a href="'+socialFeed.mediaImageUri+'" class="viamagus-image-lightbox">	<img src="'+socialFeed.mediaImageUri+'" class="img-pull-left"></a>';
					socialFeedRowHtml = socialFeedRowHtml+'		</div>';
				}
				socialFeedRowHtml = socialFeedRowHtml+'		<img src="/static/sitebuilder/img/Twitter-Bird-48.png" class="pull-right social-img">';
				socialFeedRowHtml = socialFeedRowHtml+'		<p class="para-padding">'+socialFeed.message.replace(/\n/g, "<br />");+'</p>';
				socialFeedRowHtml = socialFeedRowHtml+'		</div></div></div>';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="section-center2">';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="span12">';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="span11"><h3 class="social-header">'+socialFeed.postedBy+'</h3></div>';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="span1">';
				if(socialFeed.profileImageUri!=null && socialFeed.profileImageUri!=""){
					socialFeedRowHtml = socialFeedRowHtml+'		<div class="section-style2">';
					socialFeedRowHtml = socialFeedRowHtml+'		<img src="'+socialFeed.profileImageUri+'" class="social-img1"></div>';
				}else{
 				    socialFeedRowHtml = socialFeedRowHtml+'		<div class="section-style2">';
					socialFeedRowHtml = socialFeedRowHtml+'		<img src="/static/sitebuilder/img/Employee-128.png" class="social-img1"></div>';
				}
				socialFeedRowHtml = socialFeedRowHtml+'		</div></div></div></div>';
		}else{
				socialFeedRowHtml = socialFeedRowHtml+'<div class="row-fluid '+animationClass+'">';
				socialFeedRowHtml = socialFeedRowHtml+'		<div class="section-center3">';
				socialFeedRowHtml = socialFeedRowHtml+'<div class="span12 vm-wall-bckgnd vm-wall-bckgnd2">';
				socialFeedRowHtml = socialFeedRowHtml+'<div class="span12">';
				socialFeedRowHtml = socialFeedRowHtml+'<img src="/static/sitebuilder/img/Twitter-Bird-48.png" class="pull-left social-img">';
				
				if(socialFeed.mediaImageUri!=null && socialFeed.mediaImageUri!=""){
					
				socialFeedRowHtml = socialFeedRowHtml+'<div class="section-style3">';
				socialFeedRowHtml = socialFeedRowHtml+'	<a href="'+socialFeed.mediaImageUri+'" class="viamagus-image-lightbox">	<img src="'+socialFeed.mediaImageUri+'" class="img-pull-right"></a></div>';
				
				}
				socialFeedRowHtml = socialFeedRowHtml+'<p class="para-padding">'+socialFeed.message.replace(/\n/g, "<br />");+'</p>';
				socialFeedRowHtml = socialFeedRowHtml+' </div></div></div>';
				socialFeedRowHtml = socialFeedRowHtml+'<div class="section-center4"><div class="span12"><div class="span1"><div class="section-style4">';
			    if(socialFeed.profileImageUri!=null && socialFeed.profileImageUri!=""){
					
					socialFeedRowHtml = socialFeedRowHtml+'		<img src="'+socialFeed.profileImageUri+'" class="social-img2">';
				}else{
 				    
					socialFeedRowHtml = socialFeedRowHtml+'		<img src="/static/sitebuilder/img/Employee-128.png" class="social-img2">';
				}
				
				socialFeedRowHtml = socialFeedRowHtml+'</div></div>';
				socialFeedRowHtml = socialFeedRowHtml+'<div class="span11"><h3 class="social-header2">'+socialFeed.postedBy+'</h3></div>';
				socialFeedRowHtml = socialFeedRowHtml+'</div></div></div>';
        }
        socialFeedContainer.append(socialFeedRowHtml);

	},_initFormPlugins:function(options){
	     if(options.sitebuilder){
		   	$('.viamagus-star-rating').each(function() {
					var stars = $(this).attr("data-number");
					$(this).raty({ number: stars,click: function(score, evt) {
						$(this).attr('data-score',score);
					},hints: []
		    });
		});
	  }
	},_applyEqualHeightSplitLayout:function(){
		$(".viamagus-img-txt-split").each(function(index,item){
     			if($(window).outerWidth()>767){
     				var splitImgHeight = $(item).find('.img-container').height();
     				var splitTextHeight = $(item).find('.txt-container').height();
     				var splitMaxHeight = (splitImgHeight > splitTextHeight) ? splitImgHeight : splitTextHeight;
     				if(splitImgHeight > splitTextHeight){
     					$(item).find('.txt-container').css({height:splitMaxHeight});
     					/*$(item).find('.img-container').css({textAlign:''});
     					$(item).find('.img-container').css({verticalAlign:''});*/
     				}else{
     					/*$(item).find('.txt-container').css({textAlign:''});*/
     					$(item).find('.txt-container-vertical-alignment').attr('style', '');
     					$(item).find('.img-container').css({height:splitMaxHeight});
     				}
	     		}else{
    		 		$(item).find('.txt-container').removeProp('height');
     				$(item).find('.img-container').removeProp('height');
     				$(item).find('.txt-container-vertical-alignment').attr('style', '');
     				$(item).find('.img-container').css({textAlign:''});
     				$(item).find('.img-container').css({verticalAlign:''});
     				$(item).find('.txt-container').css({textAlign:''});
     			}
     		});
    },_mobilePaddingHandler:function(){
    	
	},_applyEqualHeightCustomForm:function(){
		$(".VideoImageFormContainer").each(function(index,item){
     			if($(window).outerWidth()>767){
     				var formContainer = $(item).find('.viamagus-form-container').height();
     				var videoImgContainer = $(item).find('.viamagus-video-img-container').height();
     				var MaxHeight = (formContainer > videoImgContainer) ? formContainer : videoImgContainer;
     				if(formContainer > videoImgContainer){
     					$(item).find('.viamagus-video-img-container').css({height:MaxHeight});
     				}else{
     					$(item).find('.viamagus-form-container').css({height:MaxHeight});
     				}
	     		}else{
	     			$(item).find('.viamagus-form-vertical-alignment-style').attr('style', '');
    		 		$(item).find('.viamagus-form-container').attr('style', '');
     				$(item).find('.viamagus-video-img-container').attr('style', '');
     				$(item).find('.text-center').css({paddingTop:''});
     			}
     		});
    },
	_coverPagePullDownArrowHandler:function(){
		var isCoverWebiste = false;
		var menuHeight = 0;
		if($(".viamagus_landimg").first().attr('data-bkg-as-cover')=='true'){
		  isCoverWebiste = true;
		  menuHeight = $('.viamagus_header').height();
		}
		/*$('.viamagus-cover-page-pull-down-arrow').click(function(e){
				e.preventDefault();
				$('html, body').animate({
        			scrollTop: $(".viamagus_landimg").first().height()-menuHeight
    			}, 500);
    			return false;
			});*/
		var that = this;
		var isScrollDownArrowRequired = false;
		var scrollTopHeight =0; 
		if($(".viamagus_landimg").length>0){
			if($(".viamagus_landimg").first().attr('data-bkg-as-cover')=='true' && $(".viamagus_landimg").first().offset().top<300){
				isScrollDownArrowRequired = true;
				scrollTopHeight = $(".viamagus_landimg").first().height()-menuHeight;
			}
		}
		if($(".carousel").length>0){
			if($(".carousel").first().attr('data-bkg-as-cover')=='true' && $(".carousel").first().offset().top<300){
				isScrollDownArrowRequired = true;
				scrollTopHeight = $(".carousel").first().height()-menuHeight;
			}
		}
		if(isScrollDownArrowRequired){
			//var scrollDownArrowHTML = '<div class="vm-arrow-div"><a href="#" class="vm-arrow vm-animated vm-bounce viamagus-cover-page-pull-down-arrow"></a></div>';
			//$('body').append(scrollDownArrowHTML);
			$('.viamagus-cover-page-pull-down-arrow').click(function(e){
				e.preventDefault();
				$('html, body').animate({
        			scrollTop: scrollTopHeight
    			}, 500);
    			return false;
			});
		}
		/*
		$(window).scroll(function() {
			if(isScrollDownArrowRequired){
				if($(window).scrollTop()>$(window).outerHeight()){
					$('.vm-arrow-div').hide();
				}else{
					$('.vm-arrow-div').show();
				}
			}
		});*/
	},_applyParallaxForHeroSection:function(){
		try{
		$(".viamagus_landimg").each(function(index, e) {
           var backgroundPosition = $(e).attr("data-image-position");
		   if($(window).outerWidth()>1024){
		      $(e).parallax('50%',0.3);
		   }
		});}catch(e){}
	},
	initUpdatesTicker:function(){
		var viamagus_update_ticker = {
		    tickInterval:'',
            newsbar:'',
			newsbarItems:'',
            init:function(){
		 		var that =this;
				 $.ajax({
						url : '/REST/general/loadWebsiteUpdate/',
						type : 'POST',
						data : {
							format : 'json'
							
						},
						dataType : 'jsonp',
						jsonp : 'jsonCallback'
					}).done(function(data) {
						  if(data.result.length){
							var updateTickerHtml = [];
							updateTickerHtml.push('<div class="viamagus-news-bar"  style="bottom: 0px; opacity: 1;z-index:1; height: 34px; line-height: 24px;">');
							updateTickerHtml.push('<div class="viamagus-news-bar-title"><a href="updates.html"><h2 style="height: 24px; line-height: 24px;">Updates</h2></a></div>');
							updateTickerHtml.push('<div><ul class="viamagus-news-bar-items" style="max-width: 100%; margin-top: 0px;">');
							for (var i=0;i<data.result.length;i++)
							{
								var updateContent =  document.createElement("DIV");
								try{
								  updateContent.innerHTML = decodeURIComponent(data.result[i].updateContent);
								}catch(e){
								  updateContent.innerHTML = data.result[i].updateContent;
								}
								updateTickerHtml.push('	<li style="height: 24px; line-height: 24px; overflow: hidden;" class="">');
								updateTickerHtml.push('		<a href="'+data.result[i].pageUrl+'" target="_blank" title="recent Update" data-toggle="tooltip">'+updateContent.textContent.substring(0,100)+'</a> | '+data.result[i].updateDate+'');
								updateTickerHtml.push('</li>');
							}
							updateTickerHtml.push('	</ul></div>');
							updateTickerHtml.push('<div class="viamagus-news-bar-navigate" style="height: 29px;line-height:29px;"><a id="viamagus-update-prev" href="#" class="prev" alt="Previous"><i class="fa fa-chevron-left"></i></a> <a href="#" id="viamagus-update-next" class="next" alt="Next"><i class="fa fa-chevron-right"></i></a></div></div>');
							$('body').append(updateTickerHtml.join(""));
							that.newsbar = $('.viamagus-news-bar');
							that.newsbarItems = $('.viamagus-news-bar').find('.viamagus-news-bar-items');
							that.initEvents();
						 }
					});
  
			},initEvents:function(){
				var that =this;
			   $('#viamagus-update-prev').unbind();
			   $('#viamagus-update-prev').click(function(e){
				   e.preventDefault();
				   that.nextUpdate();
			   });
			   
			   $('#viamagus-update-next').unbind();
			   $('#viamagus-update-next').click(function(e){
				   e.preventDefault();
				   that.prevUpdate();
			   });	
			   that.tick();
			   that.pauseOnHover();
			},nextUpdate:function(){
				this.newsbarItems.css("margin-top",  "-30px");
				this.newsbar.find(".viamagus-news-bar-items li:last").prependTo(this.newsbar.find(".viamagus-news-bar-items"));
				this.newsbar.find(".viamagus-news-bar-items").animate({marginTop: "0px" }, 500, "linear", function() {
				});
			},prevUpdate:function(){
				  var that =this;
				   that.newsbar.find(".viamagus-news-bar-items").animate({marginTop: "-30px"}, 500, "linear", function() {
						that.newsbarItems.find("li:first").appendTo(this).hide().fadeIn(300), that.newsbarItems.css("margin-top", 0)
					});
			},tick:function(){
				var that =this;
				this.tickInterval = setInterval(function() {
						that.nextUpdate();
					}, 4000);
			},pauseOnHover:function(){
				var that =this;
				that.newsbarItems.find("li").on("hover mouseover mouseup", function() {
					   clearInterval(that.tickInterval);
					}).on("mouseout mousedown", function() {
						that.tick();
					})
			}  
		};
		viamagus_update_ticker.init();
	},_loadEcommProductList:function(){
		var that =this;
		if($(".vm-currency-container").length>0){
			Viamagus_Currency_Manager.init();		   
		}
		if($(".vm-ecommerce-listing").length>0){
			$(".vm-ecommerce-listing").each(function(index,container){
			that._ecomProductList.push(new viamagusEcomListing(false,$(container)));
			});	
			//Viamagus_Product_Mangager.init(false);		   
		}
		if($(".vm-product-page").length>0){
		    that._ecomProductList.push(new viamagusEcomListing(true,''));
			//$('.vm-format-number').number(true,2);
		 //  Viamagus_Product_Mangager.init(true);
		 //init zoom
			that.initElevateZoomImageZoomerPlugin();
		}
		if($(".viamagus-shopping-cart").length>0){
			Viamagus_Cart_Manager.init();		   
		}
		
		if($(".viamagus-ecommerce-site").length>0){
			Viamagus_Cart_Manager.setCartSize();		   
		}
		if($('.viamagus-ecom-sign-in-link-section').length){
	  		 
	  	  Viamagus_Cart_Manager.checkLoginStatus(false,false,function(){ 
	  	  	        $('.viamagus-ecom-sign-in-link-section').hide();
                    $('.viamagus-ecom-sign-in-success').show();
                }); 

          //register sign in event
          $('.viamagus-ecom-sign-in-link').unbind();
          $('.viamagus-ecom-sign-in-link').click(function(event) {
          	event.preventDefault();
				Viamagus_Cart_Manager.manageEcomSignUp(false,true,function(){ 
	  	  	        $('.viamagus-ecom-sign-in-link-section').hide();
                    $('.viamagus-ecom-sign-in-success').show();
					$('#signUpModal').modal('hide');
                });	
          });
		  $('.viamagus-ecom-sign-out').unbind();
          $('.viamagus-ecom-sign-out').click(function(event) {
          	event.preventDefault();
				Viamagus_Cart_Manager.signOutOfWebsite();	
          });

	  	}
		if($('.viamagus-ecom-my-orders').length){
			Viamagus_Cart_Manager.loadMyOrders();
		}
	},_loadSlickGallery:function(){
		/*if($(".viamagus-coverflow").length>0){
			$(".viamagus-coverflow .ContentFlow").each(function(index,item){
				new ContentFlow($(item).attr('id'), {reflectionColor: "#000000",scrollWheelSpeed :0});
			});		   
		}*/
		if($(".viamagus-slick-gallery").length>0){
			$(".viamagus-slick-gallery").each(function(index,item){
				var slidesToShow = 1 ;
				var slideDuration=2000;
				var fade=false;
                if($(item).attr("data-no-of-images")!=""){
                    slidesToShow = $(item).attr("data-no-of-images");
                }
                if($(item).attr("data-slide-duration")!=""){
                    slideDuration = $(item).attr("data-slide-duration");
                }
				var autoplay=true;
				if($(item).attr("data-auto-play")!=""){
				   autoplay=$(item).attr("data-auto-play");
				}
				if(slidesToShow==1){
				    fade=true;
				}
					$(item).on('init', function (event,slick) {  
					 $(slick.$slides[slick.currentSlide]).find('.slick-item-desc-container').fadeIn(1000);}).slick({dots: true,
								infinite: true,
								autoplaySpeed: slideDuration,
						        fade:fade,
						        speed:2000,
						        autoplay:autoplay,
								slidesToShow: slidesToShow,
								slidesToScroll: 1,
						responsive: [{
											breakpoint: 720,
											settings: {
												slidesToShow: 1,
												slidesToScroll: 1,
												infinite: true,
												fade:fade,
																		
													dots: true

											}
									}]
										
					});
					$(item).on('afterChange', function(event, slick, currentSlide, nextSlide){
					  $(slick.$slides[currentSlide]).find('.slick-item-desc-container').fadeIn(1000);
				    });
					$(item).on('beforeChange', function(event, slick, currentSlide, nextSlide){
						  $(slick.$slides[nextSlide]).find('.slick-item-desc-container').hide();
					});

			});		   
		}
		// $('.viamagus_image img').socialpic();
	},_setSlickGallerySectionAsCover: function(options) {
	var that = this;
	$(".viamagus-slick-gallery").each(function(index, e) {
		if ($(e).attr("data-bkg-as-cover") != "" && $(e).attr("data-bkg-as-cover") == "true") {
			$(e).css({
				height: $(window).outerHeight()
			});
			$(e).find('.slick-item').css({
					height: $(window).outerHeight()
			});

			if (!options.siteBuilder) {
				var carouselComponent;
				if($(e).parent().hasClass('viamagus-component-content')){
					carouselComponent = $(e).parent().parent().parent();	
				}else{
					carouselComponent = $(e).parent();
				}
				if (carouselComponent.prev().length && carouselComponent.prev().prop('class').indexOf('viamagus_header') != -1) {
					var style='';
					var initialStyle='';
					if(carouselComponent.attr("style")==undefined){
						style = '';
					}else{
						style = carouselComponent.attr("style");
						initialStyle =carouselComponent.attr("style");
					}
					var menuOffSetTop = $('.viamagus_header').offset().top;
					if(menuOffSetTop==0){
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
					}else{
						style = style;
					}
					$(window).scroll(function() {
		    			/*var scrollTop = $( window ).scrollTop();
		    			var style = '';
		    			if(scrollTop < $('.viamagus_header').height()){
		    				style = initialStyle + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
	    					carouselComponent.attr("style", style);
		    			}*/
					});
					carouselComponent.attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						carouselComponent.css({
							position: 'relative'
						});
						carouselComponent.css({
							/*"z-index": '-1'*/
						});
						var style = carouselComponent.attr("style");
						style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important";
						carouselComponent.attr("style", style);
					});
				}
				if (carouselComponent.next().length && carouselComponent.next().prop('class').indexOf('viamagus_header') != -1) {
					var style = "";
					if (carouselComponent.next().attr("style")) {
						style = carouselComponent.next().attr("style");
					}
					style = style/* + "margin-top:-" + $('.viamagus_header').height() + "px !important;margin-bottom:"+ $('.viamagus_header').height() + "px"*/;
					carouselComponent.next().attr("style", style);
					$('.viamagus_header .brand').find('img').load(function() {
						carouselComponent.css({
							position: 'relative'
						});
						
						
						carouselComponent.next().attr("style", style);
					});
				}
				//that.registerWindowScrollEventForCoverWebsites();
			} else {
				var sitebuildercarouselcomponent;
				if($(e).parent().hasClass('viamagus-component-content')){
					sitebuildercarouselcomponent = $(e).parent().parent().parent();	
				}else{
					sitebuildercarouselcomponent = $(e).parent();
				}
				if (sitebuildercarouselcomponent.parent().prev().find(".viamagus_header").length && sitebuildercarouselcomponent.parent().prev().find(".viamagus_header").prop('class').indexOf('viamagus_header') != -1) {
					sitebuildercarouselcomponent.css({
						position: 'relative'
					});
					
					var style = sitebuildercarouselcomponent.attr("style");
					style = style + "margin-top:-" + $('.viamagus_header').height() + "px !important;";
					sitebuildercarouselcomponent.attr("style", style);
				}
			}
		}
	});
},_customizeViamagusButtonClickEvent:function(){

	  $('.viamagus-cart-button a.btn').click(function(e){
		var pageName="home.html";
		var urlContent =  document.URL.split('/');
		for(var i in urlContent){
			if(urlContent[i].search('.html')!=-1 && urlContent[i].indexOf('#')==-1){
				pageName = urlContent[i];
			}
			if(urlContent[i].search('.html')!=-1 && urlContent[i].indexOf('#')!=-1){
				pageName = urlContent[i].split('#')[0];
			}
		}
	    var href=$(this).attr("href");
		if(href.indexOf('#')!=-1){
           var urlComponentId = href.split('#');
		   if(pageName==urlComponentId[0] || urlComponentId[0]==""){
			  e.preventDefault();
			   var offset = $('#'+urlComponentId[1]).offset().top;
			   if($('.viamagus_header').css('position')=='fixed'){
			     offset = offset - $('.viamagus_header').height();
			   }else if($(".viamagus_landimg").first().attr('data-bkg-as-cover')=='true'){
			      offset = offset - $('.viamagus_header').height();
			   }
			   $('html, body').animate({
					scrollTop: offset
				}, 1000, 'swing', null);
		   }
		}
	  });
	  $('.viamagus-image-text a.btn').click(function(e){
		var pageName="home.html";
		var urlContent =  document.URL.split('/');
		for(var i in urlContent){
			if(urlContent[i].search('.html')!=-1 && urlContent[i].indexOf('#')==-1){
				pageName = urlContent[i];
			}
			if(urlContent[i].search('.html')!=-1 && urlContent[i].indexOf('#')!=-1){
				pageName = urlContent[i].split('#')[0];
			}
		}
	    var href=$(this).attr("href");
		if(href.indexOf('#')!=-1){
           var urlComponentId = href.split('#');
		   if(pageName==urlComponentId[0] || urlComponentId[0]==""){
			  e.preventDefault();
			   var offset = $('#'+urlComponentId[1]).offset().top;
			   if($('.viamagus_header').css('position')=='fixed'){
			     offset = offset - $('.viamagus_header').height();
			   }
			   $('html, body').animate({
					scrollTop: offset
				}, 1000, 'swing', null);
		   }
		}
	  });
	  
	},_enableCollapsableSections:function(){
		if($(".viamagus-collapse-icon").length>0){
			$('.viamagus-collapse-icon').unbind();
			$('.viamagus-collapse-icon').click(function(e){
                e.preventDefault();
                var collapseSectionId= $(this).attr("data-collapse-section");
                if($('#'+collapseSectionId).is(':visible')){
                    $(this).html('<i class="fa fa-plus"></i>');
                }else{
                	$(this).html('<i class="fa fa-minus"></i>');
                }
                $('#'+collapseSectionId).toggle('slow'); 
			});		   
		}
	},getInternetExplorerVersion:function() {
		var ver = -1; // Return value assumes failure.
		var msg = "You're not using Internet Explorer.";
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent;
			var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");

			if (re.exec(ua) != null) {
				ver = parseFloat( RegExp.$1 );
				if ( ver > -1 ) {
					if ( ver <= 8.0 ) {
						msg = "Please upgrade your copy of Internet Explorer.";
						alert(msg);
					}
				}
				
			}
		}

		return rv;
	},_setFooterAsSticky:function(){
	
	  if($('.viamagus_footer').length && $('.viamagus_footer').is(':visible')){
		  var footerOffsetTop = $('.viamagus_footer').offset().top;
		  var footerHeight = $('.viamagus_footer').height()
		  var windowHeight = $(window).outerHeight();
		  if(footerOffsetTop<(windowHeight-footerHeight)){
			//$('.viamagus_footer').attr('style','position:fixed;bottom:0;z-index:1010;width:100%;');	  
		  }
	  }
	},_initSocialSharePlugin:function(){
		if($(".vm-blog").length){
		  Viamagus_Blog_Share.init();
		}
	},initElevateZoomImageZoomerPlugin : function(){

		if($('#vm-product-image-gallery').length){
           var zoomType='window';
		   if($(window).outerWidth()<800){
		      zoomType='lens';
		   }
			$("#vm-product-primary-image").elevateZoom(
			 { gallery:'vm-product-image-gallery',galleryActiveClass: 'active',cursor: 'pointer',zoomType:zoomType }); 

				
				$("#vm-product-primary-image").bind("click", function(e) { 
					var ez = $('#vm-product-primary-image').data('elevateZoom');  
					$.fancybox(ez.getGalleryList()); 
					return false; 
				}); 

				
				$('#vm-product-slider').Thumbelina({
					$bwdBut:$('#vm-product-slider .left'),    // Selector to left button.
					$fwdBut:$('#vm-product-slider .right')    // Selector to right button.
				});  
			
					
	     }
		 
	},_initAudioPlugin:function(){
	 if($('.viamagus-audio-gallery').length){  
		  var audioLength =$('.viamagus-audio-gallery .span4').width();
		  audiojs.events.ready(function() {
			audiojs.createAll();
		  });
		  $('head').append('<style>.audiojs .scrubber { width:'+(audioLength-165)+'px !important;} .audiojs {width:'+audioLength+'px !important;}</style>');
	 }
	},_setHeroImageAspectRatioOnOrientationChange:function(){
		
	    if($(".viamagus_landimg").length){
			$(".viamagus_landimg").each(function(index, e) {
				if($(e).attr("data-img-uri")!=""){
					if($(window).outerWidth()>800){
						$(e).backstretch($(e).attr("data-img-uri"));
					}
				}
				if($(e).attr("data-portrait-img-uri")!=""){
					if($(window).outerWidth()<$(window).outerHeight() && $(window).outerWidth()<800){
						$(e).backstretch($(e).attr("data-portrait-img-uri"));
					}
				}
			});
	    }
	    if($(".viamagus_txt-slide").length){
			if($(".viamagus_txt-slide").attr("data-bkg-img")!=""){
				if($(window).outerWidth()<800){
					$(".viamagus_txt-slide").children("#magus-carousel").backstretch($(".viamagus_txt-slide").attr("data-bkg-img"));
				}
			}
	    }
	},registerShowDirections:function(){
		var that =this;
		if($('#showDirections').length){
		   $('#showDirections').click(function(e){
			  e.preventDefault();
			  if (navigator.geolocation) {
				  navigator.geolocation
							.getCurrentPosition(function(position) {
								var userLocationLatLng = new google.maps.LatLng(
										position.coords.latitude,
										position.coords.longitude);
								that.showDirections(userLocationLatLng);
				  }, function(error) {
					//debugger;
					//alert(error);
					
				},{timeout:5000});
			  }
		   });
		}

	},
    showDirections:function(userLocationLatLng){
		var mp_marker_url = "imgs/b0dc1228f2c289cb6d03084943206cf0.png";
	    var mp_marker_w = 75;
	    var mp_marker_h = 103;
	    var mp_marker_title = "M";
		var marker = new google.maps.MarkerImage(mp_marker_url, new google.maps.Size(mp_marker_w,mp_marker_h), new google.maps.Point(0,0) );
	     var latLng = new google.maps.LatLng(12.969431,77.600845);
			var latLngJson = $('#latLng').html();
			
			if(latLngJson!=""){
				latLng = JSON.parse(latLngJson);
				var newArray = [];

				for (var key in latLng) {

				   newArray.push(key);

				}
				
				latLng = new google.maps.LatLng(latLng[newArray[0]],latLng[newArray[1]]);
				
				
			}
			var location1 = latLng;
			var location2 = userLocationLatLng;
			// center of the map (compute the mean value between the two locations)
			latlng = new google.maps.LatLng(
					(location1.lat() + location2.lat()) / 2,
					(location1.lng() + location2.lng()) / 2);
			// set map options
			// set zoom level
			// set center
			// map type
			var mapOptions = {
				zoom : 12,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				mapMaker : true
			};

			// create a new map object
			// set the div id where it will be shown
			// set the map options
			map = new google.maps.Map(document.getElementById("map-container"), mapOptions);
			var h = $(window).height(), abc = 160; // Calculate the top offset

			directionsService = new google.maps.DirectionsService();
			directionsDisplay = new google.maps.DirectionsRenderer({
				suppressMarkers : true,
				suppressInfoWindows : true
			});
			directionsDisplay.setMap(map);
			var request = {
				origin : location1,
				destination : location2,
				travelMode : google.maps.DirectionsTravelMode.DRIVING
			};
			directionsService
					.route(
							request,
							function(response, status) {
								if (status == google.maps.DirectionsStatus.OK) {
									directionsDisplay.setDirections(response);
									distance = "The aproximative distance to the store from your current location is: "
											+ response.routes[0].legs[0].distance.text;
									/* distance += "<br/>The approximate distance to the  driving time is: "
											+ response.routes[0].legs[0].duration.text; */
									document.getElementById("distance_road").innerHTML = distance;
								}
							});

			// create the markers for the two locations		
			var marker1 = new google.maps.Marker({
				map : map,
				position : location1,
				title : "Store location",
                icon:marker
			});
			var marker2 = new google.maps.Marker({
				map : map,
				position : location2,
				title : "My location"
			});

			// create the text to be shown in the infowindows
			var text1 = '<div id="content">'
					+ '<h1 id="firstHeading">Store location</h1>'
					+ '</div>';

			var text2 = '<div id="content">'
					+ '<h1 id="firstHeading">My location</h1>'
					+ '</div>';

			// create info boxes for the two markers
			var infowindow1 = new google.maps.InfoWindow({
				content : text1
			});
			var infowindow2 = new google.maps.InfoWindow({
				content : text2
			});

			// add action events so the info windows will be shown when the marker is clicked
			google.maps.event.addListener(marker1, 'click', function() {
				infowindow1.open(map, marker1);
			});
			google.maps.event.addListener(marker2, 'click', function() {
				infowindow2.open(map, marker1);
			});

			
		}

}


//register orientation change event outside

$(window).on("orientationchange",function(){
  Viamagus_Website_Loader._init();
  Viamagus_Website_Loader._setHeroImageAspectRatioOnOrientationChange();

});
