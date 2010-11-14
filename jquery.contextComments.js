/*************************************************************\
|                                                             |
\*************************************************************/
(function($) {
	var settings;
	var commentPlaceholders = [
		["ID", "id"],
		["dateTime", "dateTime"],
		["content", "content"],
		["authorName", "author.name"],
		["authorURL", "author.url"]
	];

	$.fn.contextComments = function(options) {
		var defaults = {
			elements: ["h1", "p", "ul", "img"],
			fetchCommentsLocation: "http://localhost/contextComments.php",
			submitCommentLocation: "http://localhost/contextComments.php",
			commentFormat: "<div class='commentContainerComment'>__content__</div><div class='commentContainerDetails'><a href='__authorURL__' title='__authorName__' target='_blank'>__authorName__</a> @ __dateTime__</div>"
		};

		settings = $.extend(defaults, options);

		//execute this for every element matched by the passed-in selector
		this.each(function(index, element) {
			//get and loop over every element specified in the settings inside this element
			$(element).find(settings.elements.join(", ")).each(function(index, element) {
				initializeElement(element);
			});
		});

		//return the jQuery object to allow for chainability
		return this;
	};

	$("#closeCommentBox, #commentOverlay").live("click", function() {
		hideComments(false);
		return false;
	});

	$("#commentBox .addComment").live("click", function() {
		var addButtonData = $(this).data();
		addComment(addButtonData.$commentBox, addButtonData.id);
	});

	$("#commentBox #commentBoxFooter #cancelComment").live("click", function() {
		$(this).hide();
		$("#commentBox #commentBoxFooter .addComment").show();
		$("#commentBox #commentBoxHeader #commentBoxHeaderWrite").hide();
		$("#commentBox #commentBoxHeader #commentBoxHeaderRead").fadeIn();
		$("#commentBox #commentBoxBody #addCommentForm").slideUp(function() {
			$(this).remove();
			$(".commentContainer, #noCommentContainer").slideDown();
		});
	});

	$("#commentBox #commentBoxBody #addCommentForm #contextCommentForm").live("submit", function() {
		submitComment($(this));
		return false;
	});

	$("#commentBox #commentBoxBody #addCommentForm #contextCommentForm #contextCommentForm_content").live("blur keypress", function() {
		autogrowTextarea(this);
	});

	function addComment($commentBox, id) {
		//if there is already a form to add a comment, don't add another one
		if ($("#addCommentForm").length > 0) {
			return;
		}
		var $commentContainers = $(".commentContainer");
		//if there are no comment containers, then get the no comment container instead
		if ($commentContainers.length == 0) {
			$commentContainers = $("#noCommentContainer");
		}
		var count = 0;
		$("#commentBox #commentBoxHeader #commentBoxHeaderRead").hide();
		$("#commentBox #commentBoxHeader #commentBoxHeaderWrite").fadeIn();
		$commentContainers.slideUp(function() {
			count += 1;
			//once the last comment has slid up
			if (count == $commentContainers.length) {
				$("#commentBox #commentBoxFooter .addComment").hide();
				$("#commentBox #commentBoxFooter #cancelComment").show();
				//create and insert the form
				var commentForm = document.createElement("div");
				commentForm.id = "addCommentForm";
				$commentBox.find("#commentBoxBody").prepend(commentForm);
				$(commentForm).hide().html(buildCommentForm(id)).slideDown();
				$commentBox.find("#commentBoxBody #addCommentForm #contextCommentForm #contextCommentForm_authorName").focus();
			}
		});
	}

	function autogrowTextarea(textarea) {
		lines = textarea.value.split("\n");
		rows = 1;
		for (i = 0; i < lines.length; i++) {
			if (lines[i].length >= textarea.cols) {
				rows += Math.floor(lines[i].length / textarea.cols);
			}
		}
		rows += (lines.length) - 1;
		if ((rows > textarea.rows) || (rows < textarea.rows)) {
			textarea.rows = rows;
		}
	}

	function buildCommentForm(id) {
		var commentForm = "";
		commentForm += "<form id='contextCommentForm'>";
		commentForm += "<input type='hidden' id='contextCommentForm_elementID' value='" + id + "' />";
		commentForm += "<p><label for='contextCommentForm_authorName'>Your name</label><input type='text' id='contextCommentForm_authorName' value='' /></p>";
		commentForm += "<p><label for='contextCommentForm_content'>Comment</label><textarea id='contextCommentForm_content' cols='70' rows='1'></textarea></p>";
		commentForm += "<p><label for='contextCommentForm_submit'>&nbsp;</label><input type='submit' id='contextCommentForm_submit' value='Submit' /></p>";
		commentForm += "</form>";
		return commentForm;
	}

	function displayComments($commentBox, data, id) {
		$commentBox.html("<div id='commentBoxHeader'><div id='commentBoxHeaderRead'>Comments (<span id='commentBoxHeaderCounter'>" + data.comments.length + "</span>)</div><div id='commentBoxHeaderWrite'>Adding a comment</div></div><div id='commentBoxBody'></div><div id='commentBoxFooter'><a href='#' class='addComment' title='Add a comment'>Add a comment</a><a href='#' id='cancelComment' title='Cancel comment'>Cancel comment</a><a href='#' id='closeCommentBox' title='Close comments'></a></div>");
		$("#commentBox #commentBoxFooter #cancelComment").hide();
		$("#commentBox #commentBoxHeader #commentBoxHeaderWrite").hide();
		var $commentBoxBody = $("#commentBoxBody");
		if (data.comments.length == 0) {
			var noCommentContainer = document.createElement("div");
			noCommentContainer.id = "noCommentContainer";
			$commentBoxBody.html(noCommentContainer);
			$(noCommentContainer).html("No comments have been added to this context yet. Would you like to <a href='#' class='addComment' title='Add a comment'>add one</a>?");
		}
		else {
			var commentHTML;
			$.each(data.comments, function(commentIndex, commentValue) {
				commentHTML = settings.commentFormat;
				$.each(commentPlaceholders, function(placeholderIndex, placeholderValue) {
					commentHTML = commentHTML.replace(new RegExp("__" + placeholderValue[0] + "__", "g"), eval("commentValue." + placeholderValue[1]));
				});
				var commentContainer = document.createElement("div");
				commentContainer.className = "commentContainer";
				$commentBoxBody.append(commentContainer);
				$(commentContainer).hide().html(commentHTML).slideDown();
			});
		}
		$(".addComment").data({$commentBox:$commentBox, id:id});
	}

	function fetchComments(element, commentBox) {
		$.ajax({
			url: settings.fetchCommentsLocation,
			cache: false,
			context: commentBox,
			data: {elementID: element.id},
			dataType: "json",
			error: function(XMLHttpRequest, status, ex) {
				$(this).html("The comments could not be retrieved.");
				setTimeout(hideComments, 5000);
			},
			success: function(data, status, XMLHttpRequest) {
				displayComments($(commentBox), data, element.id);
			}
		});
	}

	function hideComments(immediate) {
		$(document).unbind("keydown.contextComments");
		if (immediate) {
			$("#commentBox, #commentOverlay").remove();
		}
		else {
			$("#commentBox, #commentOverlay").fadeOut(function(){
				$(this).remove();
			});
		}
	}

	function initializeElement(element) {
		var commentIcon = document.createElement("a");
		commentIcon.href = "#";
		commentIcon.className = "commentIcon";
		commentIcon.title = "View/add a comment";
		$(element).before(commentIcon);
		$(commentIcon).click(function() {
			showComments(element);
			return false;
		}).hover(function() {
			$(element).toggleClass("elementHover");
		});
	}

	function showComments(element) {
		hideComments(true);
		var commentBox = document.createElement("div");
		commentBox.id = "commentBox";
		commentBox.className = "contextCommentRound";
		var commentOverlay = document.createElement("div");
		commentOverlay.id = "commentOverlay";
		commentOverlay.className = "contextCommentTransparent";
		var loadingImage = document.createElement("span");
		loadingImage.className = "contextCommentLoading";
		$("body").append(commentOverlay).append(commentBox);
		$(commentOverlay).hide().fadeIn();
		$(commentBox).html("fetching comments...").append(loadingImage).hide().fadeIn();
		$(document).bind("keydown.contextComments", function(event) {
			if (event.keyCode == 27) {
				hideComments(false);
			}
		});
		fetchComments(element, commentBox);
	}

	function submitComment($form) {
		$("#commentBox #commentBoxBody #addCommentForm #validationMessages").remove();
		if (validateAddCommentForm($form)) {
			//form validated, let's submit it
			var formData = {};
			var response;
			var inputName;
			$form.find("input, textarea").each(function(index) {
				inputName = this.id.split("_")[1];
				formData[inputName] = $.trim($(this).val());
			});
			$.ajax({
				url: settings.submitCommentLocation,
				type: "POST",
				cache: false,
				context: $("#commentBox"),
				data: formData,
				dataType: "text",
				error: function(XMLHttpRequest, status, ex) {
					response = "An error occurred while submitting your comment";
				},
				success: function(data, status, XMLHttpRequest) {
					data = $.trim(data);
					if (data == "true") {
						//the comment was successfully received by the server
						response = "Comment submitted successfully!";
						//update the comment counter in the header
						var $commentBoxHeaderCounter = $("#commentBox #commentBoxHeader #commentBoxHeaderRead #commentBoxHeaderCounter");
						var commentCount = $.trim($commentBoxHeaderCounter.html());
						commentCount = parseInt(commentCount) + 1;
						$commentBoxHeaderCounter.html(String(commentCount));
						//toggle the add/cancel comment buttons and the read/write header
						$(this).find("#commentBoxFooter #cancelComment").hide();
						$(this).find("#commentBoxFooter .addComment").show();
						$(this).find("#commentBoxHeader #commentBoxHeaderWrite").hide();
						$(this).find("#commentBoxHeader #commentBoxHeaderRead").fadeIn();
						//slide up and remove the form, then remove the noCommentContainer
						//(if there is one), and slide down all the comments
						$("#commentBox #commentBoxBody #addCommentForm").slideUp(function() {
							$(this).remove();
							$("#commentBox #commentBoxBody #noCommentContainer").remove();
							$("#commentBox #commentBoxBody .commentContainer").slideDown();
							//insert new comment here
						});
					}
					else {
						//the server rejected the comment
						response = data;
					}
				},
				complete: function(XMLHttpRequest, status) {
					var submitResult = document.createElement("div");
					submitResult.id = "submitResult";
					$(this).find("#commentBoxBody").prepend(submitResult);
					var $submitResult = $(submitResult);
					$submitResult.hide().html(response).slideDown().delay(5000).slideUp(function() {
						$(this).remove();
					});
				}
			});
		}
		else {
			//form didn't validate
			$form.find("#contextCommentForm_authorName").focus();
		}
	}

	function validateAddCommentForm($form) {
		var valid = true;
		var messages = [];
		var inputAuthorName = $.trim($form.find("#contextCommentForm_authorName").val());
		var inputContent = $.trim($form.find("#contextCommentForm_content").val());
		if (inputAuthorName == "") {
			valid = false;
			messages.push("We need to know your name!");
		}
		if (inputContent == "") {
			valid = false;
			messages.push("It helps if you enter a comment!");
		}
		if (!valid) {
			var validationMessages = document.createElement("ul");
			validationMessages.id = "validationMessages";
			$form.before(validationMessages);
			$validationMessages = $(validationMessages);
			$validationMessages.hide().html("<li>Oops! " + messages.length + " error" + ((messages.length == 1) ? "" : "s") + ":</li>");
			$.each(messages, function(index, value) {
				$validationMessages.append("<li>" + value + "</li>");
			});
			$validationMessages.slideDown();
		}
		return valid;
	}
})(jQuery);