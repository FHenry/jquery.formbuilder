/**
 * jQuery Form Builder Plugin
 * Copyright (c) 2009 Mike Botsko, Botsko.net LLC (http://www.botsko.net)
 * http://www.botsko.net/blog/2009/04/jquery-form-builder-plugin/
 * Originally designed for AspenMSM, a CMS product from Trellis Development
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * Copyright notice and license must remain intact for legal use
 */
(function ($) {
	$.fn.formbuilder = function (options) {
		// Extend the configuration options with user-provided
		var defaults = {
			save_url: false,
			load_url: false,
			control_box_target: false,
			serialize_prefix: 'frmb',
			css_ol_sortable_class : 'ol_opt_sortable',
			code_prefix: 'options_',
			confirm_delete: 'confirm-delete',
			use_ui_icon: false,
			select_language: false,
			default_language: false,
			messages: {
				save				: "Save",
				add_new_field		: "Add New Field...",
				text				: "Text Field",
				title				: "Title",
				select_date			: "Date",
				comment				: "Comment",
				paragraph			: "Paragraph",
				checkboxes			: "Checkboxes",
				radio				: "Radio",
				select				: "Select List",
				text_field			: "Text Field",
				label				: "Label",
				code				: "Code",
				comment_field		: "Comment Field",
				paragraph_field		: "Paragraph Field",
				select_options		: "Select Options",
				add					: "Add",
				checkbox_group		: "Checkbox Group",
				remove_message		: "Remove this field",
				remove_confirm		: "Ok",
				remove_cancel		: "Cancel",
				remove				: "Remove",
				move_message		: "Move this option",
				move				: "Move",
				radio_group			: "Radio Group",
				selections_message	: "Allow Multiple Selections",
				hide				: "Hide",
				required			: "Required",
				show				: "Show"
			}
		};
		var opts = $.extend(defaults, options);
		var frmb_id = 'frmb-' + $('ul[id^=frmb-]').length++;
		return this.each(function () {
			var ul_obj = $(this).append('<ul id="' + frmb_id + '" class="frmb"></ul>').find('ul');
			var field = '', field_type = '', last_id = 1, help;
			// Add a unique class to the current element
			$(ul_obj).addClass(frmb_id);
			// load existing form data
			if (opts.load_url) {
				$.getJSON(opts.load_url + '&language=' + opts.default_language, function(json) {
					fromJson(json.form_structure, json.form_language);
				});
			}
			// Create form control select box and add into the editor
			var controlBox = function (target) {
					var select = '';
					var box_content = '';
					var save_button = '';
					var box_id = frmb_id + '-control-box';
					var save_id = frmb_id + '-save-button';
					// Add the available options
					select += '<option value="0">' + opts.messages.add_new_field + '</option>';
					select += '<option value="input_text">' + opts.messages.text + '</option>';
					select += '<option value="textarea">' + opts.messages.paragraph + '</option>';
					select += '<option value="checkbox">' + opts.messages.checkboxes + '</option>';
					select += '<option value="radio">' + opts.messages.radio + '</option>';
					select += '<option value="select">' + opts.messages.select + '</option>';
					select += '<option value="select_date">' + opts.messages.select_date + '</option>';
					select += '<option value="comment">' + opts.messages.comment + '</option>';
					// Build the control box and search button content
					box_content = '<select id="' + box_id + '" class="frmb-control">' + select + '</select>';
					save_button = '<input type="submit" id="' + save_id + '" class="frmb-submit" value="' + opts.messages.save + '"/>';
					// Insert the control box into page
					if (!target) {
						$(ul_obj).before(box_content);
					} else {
						$(target).append(box_content);
					}
					if (opts.select_language) {
						$(ul_obj).before(opts.select_language);
					}
					// Insert the search button
					$(ul_obj).after(save_button);
					// Set the form save action
					$('#' + save_id).click(function () {
						save();
						return false;
					});
					// Add a callback to the select element
					$('#' + box_id).change(function () {
						appendNewField($(this).val());
						$(this).val(0).blur();
						// This solves the scrollTo dependency
						$('html, body').animate({
							scrollTop: $('#frm-' + (last_id - 1) + '-item').offset().top
						}, 500);
						return false;
					});
					// Add a callback to the select language
					$('#language').change(function () {
						var language = $(this).val();
						if (opts.load_url) {
							$.getJSON(opts.load_url + '&language=' + language, function(json) {
								$(ul_obj).children().remove();
								if (json) {
									fromJson(json.form_structure, json.form_language);
								}
							});
						}
						return false;
					});
				}(opts.control_box_target);
			// Json parser to build the form builder
			var fromJson = function (form_structure, form_language) {
					var values = '';
					var options = false;
					var required = false;
					// Parse json
					$(form_structure).each(function (i, val) {
						// checkbox type
						if (this.cssClass === 'checkbox') {
							var fieldcode = this.code;
							options = [form_language[fieldcode].title, fieldcode];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, form_language[fieldcode].values[this.id], this.baseline]);
							});
						}
						// radio type
						else if (this.cssClass === 'radio') {
							var fieldcode = this.code;
							options = [form_language[fieldcode].title, fieldcode];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, form_language[fieldcode].values[this.id], this.baseline]);
							});
						}
						// select type
						else if (this.cssClass === 'select') {
							var fieldcode = this.code;
							options = [form_language[fieldcode].title, this.multiple, fieldcode];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, form_language[fieldcode].values[this.id], this.baseline]);
							});
						}
						else {
							values = [form_language[this.code], this.code];
						}
						appendNewField(this.cssClass, values, options, this.required);
					});
				};
			// Wrapper for adding a new field
			var appendNewField = function (type, values, options, required) {
					field = '';
					field_type = type;
					if (typeof (values) === 'undefined') {
						values = '';
					}
					switch (type) {
					case 'input_text':
						appendTextInput(values, required);
						break;
					case 'textarea':
						appendTextarea(values, required);
						break;
					case 'checkbox':
						appendCheckboxGroup(values, options, required);
						break;
					case 'radio':
						appendRadioGroup(values, options, required);
						break;
					case 'select':
						appendSelectList(values, options, required);
						break;
					case 'select_date':
						appendSelectDate(values, required);
						break;
					case 'comment':
						appendComment(values);
						break;
					}
				};
			// Adds a comment of some kind to the form.
			var appendComment = function (values) {
				var title = '';
				var code = '';
				if (typeof (values) === 'object') {
					title = values[0];
					code = values[1];
				}
					field += '<label>' + opts.messages.comment + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" />';
					help = '';
					required = 'disabled';
					appendFieldLi(opts.messages.comment_field, field, required, help, code);
				};
			// single line input type="text"
			var appendSelectDate = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.select_date, field, required, help, code);
				};
			// single line input type="text"
			var appendTextInput = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.text, field, required, help, code);
				};
			// multi-line textarea
			var appendTextarea = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.paragraph_field, field, required, help, code);
				};
			// adds a checkbox element
			var appendCheckboxGroup = function (values, options, required) {
					var title = '';
					var code = '';
					if (typeof (options) === 'object') {
						title = options[0];
						code = options[1];
					}
					field += '<div class="chk_group">';
					field += '<div class="frm-fld"><label>' + opts.messages.title + '</label>';
					field += '<input type="text" name="title" value="' + title + '" /></div>';
					field += '<div class="false-label">' + opts.messages.select_options + '</div>';
					field += '<div class="fields">';

					field += '<div><ol class="' + opts.css_ol_sortable_class + '">';

					if (typeof (values) === 'object') {
						for (i = 0; i < values.length; i++) {
							field += checkboxFieldHtml(values[i]);
						}
					}
					else {
						field += checkboxFieldHtml('');
					}

					field += '</ol></div>';

					field += '<div class="add-area"><a href="#" class="add add_ck">' + opts.messages.add + '</a></div>';
					field += '</div>';
					field += '</div>';
					help = '';
					appendFieldLi(opts.messages.checkbox_group, field, required, help, code);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button' }); // making the dynamically added option fields sortable.
				};
			// Checkbox field html, since there may be multiple
			var checkboxFieldHtml = function (values) {
					var checked = false;
					var value = '';
					var unique_id = unique_random();
					if (typeof (values) === 'object') {
						unique_id = values[0];
						value = values[1];
						checked = ( values[2] === 'false' || values[2] === 'undefined' ) ? false : true;
					}
					field = '<li class="none">';
					field += '<div>';
					field += '<input type="checkbox"' + (checked ? ' checked="checked"' : '') + ' />';
					field += '<input type="text" value="' + value + '" />';
					field += '<input type="hidden" name="unique_id" value="' + unique_id + '" />';
					field += '<a href="#" class="remove" title="' + opts.messages.remove_message + '">' + opts.messages.remove + '</a>';
					field += '<a href="#" class="move-button" title="' + opts.messages.move_message + '">' + opts.messages.move + '</a>';
					field += '</div></li>';
					useUiIcon('.remove','ui-icon-trash');
					useUiIcon('.move-button','ui-icon-triangle-2-n-s');
					return field;
				};
			// adds a radio element
			var appendRadioGroup = function (values, options, required) {
					var title = '';
					var code = '';
					if (typeof (options) === 'object') {
						title = options[0];
						code = options[1];
					}
					field += '<div class="rd_group">';
					field += '<div class="frm-fld"><label>' + opts.messages.title + '</label>';
					field += '<input type="text" name="title" value="' + title + '" /></div>';
					field += '<div class="false-label">' + opts.messages.select_options + '</div>';
					field += '<div class="fields">';

					field += '<div><ol class="' + opts.css_ol_sortable_class + '">';

					if (typeof (values) === 'object') {
						for (i = 0; i < values.length; i++) {
							field += radioFieldHtml(values[i], 'frm-' + last_id + '-fld');
						}
					}
					else {
						field += radioFieldHtml('', 'frm-' + last_id + '-fld');
					}

					field += '</ol></div>';

					field += '<div class="add-area"><a href="#" class="add add_rd">' + opts.messages.add + '</a></div>';
					field += '</div>';
					field += '</div>';
					help = '';
					appendFieldLi(opts.messages.radio_group, field, required, help, code);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button' }); // making the dynamically added option fields sortable.
				};
			// Radio field html, since there may be multiple
			var radioFieldHtml = function (values, name) {
					var checked = false;
					var value = '';
					var unique_id = unique_random();
					if (typeof (values) === 'object') {
						unique_id = values[0];
						value = values[1];
						checked = ( values[2] === 'false' || values[2] === 'undefined' ) ? false : true;
					}
					field = '';
					field += '<div>';
					field += '<input type="radio"' + (checked ? ' checked="checked"' : '') + ' name="radio_' + name + '" />';
					field += '<input type="text" value="' + value + '" />';
					field += '<input type="hidden" name="unique_id" value="' + unique_id + '" />';
					field += '<a href="#" class="remove" title="' + opts.messages.remove_message + '">' + opts.messages.remove + '</a>';
					field += '<a href="#" class="move-button" title="' + opts.messages.move_message + '">' + opts.messages.move + '</a>';
					field += '</div>';
					useUiIcon('.remove','ui-icon-trash');
					useUiIcon('.move-button','ui-icon-triangle-2-n-s');
					return field;
				};
			// adds a select/option element
			var appendSelectList = function (values, options, required) {
					var multiple = false;
					var title = '';
					var code = '';
					if (typeof (options) === 'object') {
						title = options[0];
						multiple = options[1] === 'true' ? true : false;
						code = options[2];
					}
					field += '<div class="opt_group">';
					field += '<div class="frm-fld"><label>' + opts.messages.title + '</label>';
					field += '<input type="text" name="title" value="' + title + '" /></div>';
					field += '';
					field += '<div class="false-label">' + opts.messages.select_options + '</div>';
					field += '<div class="fields">';
					field += '<input type="checkbox" name="multiple"' + (multiple ? 'checked="checked"' : '') + '>';
					field += '<label class="auto">' + opts.messages.selections_message + '</label>';
					
					field += '<div><ol class="' + opts.css_ol_sortable_class + '">';
					
					if (typeof (values) === 'object') {
						for (i = 0; i < values.length; i++) {
							field += selectFieldHtml(values[i], multiple);
						}
					}
					else {
						field += selectFieldHtml('', multiple);
					}
					
					field += '</ol></div>';
					
					field += '<div class="add-area"><a href="#" class="add add_opt">' + opts.messages.add + '</a></div>';
					field += '</div>';
					field += '</div>';
					help = '';
					appendFieldLi(opts.messages.select, field, required, help, code);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button' }); // making the dynamically added option fields sortable.
				};
			// Select field html, since there may be multiple
			var selectFieldHtml = function (values, multiple) {
					if (multiple) {
						return checkboxFieldHtml(values);
					}
					else {
						return radioFieldHtml(values);
					}
				};
			// Appends the new field markup to the editor
			var appendFieldLi = function (title, field_html, required, help, code) {
					var reg = new RegExp(opts.code_prefix, "gi");
					if (required != 'disabled') {
						required = required === 'checked' ? true : false;
					}
					var disabled = '';
					if (code.length > 0) {
						disabled = ' disabled="disabled"';
					}
					var li = '';
					li += '<li id="frm-' + last_id + '-item" class="' + field_type + '">';
					li += '<div class="legend">';
					li += '<a id="frm-' + last_id + '" class="toggle-form" href="#">' + opts.messages.hide + '</a> ';
					li += '<a id="del_' + last_id + '" class="del-button delete-confirm" href="#" title="' + opts.messages.remove_message + '"><span>' + opts.messages.remove + '</span></a>';
					li += '<strong id="txt-title-' + last_id + '">' + title + '</strong></div>';
					li += '<div id="frm-' + last_id + '-fld" class="frm-holder">';
					li += '<div class="frm-elements">';
					if (required != 'disabled') {
						li += '<div class="frm-fld"><label for="required-' + last_id + '">' + opts.messages.required + '</label>';
						li += '<input class="required" type="checkbox" value="1" name="required-' + last_id + '" id="required-' + last_id + '"' + (required ? ' checked="checked"' : '') + ' /></div>';
					}
					li += '<div class="frm-fld"><label>' + opts.messages.code + '</label>';
					li += '<input type="text" name="code" value="' + code.replace(reg, "") + '"' + disabled + ' /></div>';
					li += field_html;
					li += '</div>';
					li += '</div>';
					li += '</li>';
					$(ul_obj).append(li);
					$('#frm-' + last_id + '-item').hide();
					$('#frm-' + last_id + '-item').animate({
						opacity: 'show',
						height: 'show'
					}, 'slow');
					last_id++;
					// Use ui-icon
					useUiIcon('.del-button','ui-icon-trash');
					useUiIcon('.toggle-form','ui-icon-triangle-1-n');
					useUiIcon('.add','ui-icon-plus');
					useUiIcon('.remove','ui-icon-trash');
					useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				};
			// handle field delete links
			$('.remove').live('click', function () {
				$(this).parent('div').animate({
					opacity: 'hide',
					height: 'hide',
					marginBottom: '0px'
				}, 'fast', function () {
					$(this).remove();
				});
				return false;
			});
			// handle field display/hide
			$('.toggle-form').live('click', function () {
				var target = $(this).attr("id");
				if (opts.use_ui_icon) {
					var message = $(this).children('.ui-button-text');
				} else {
					var message = $(this);
				}
				if (message.html() === opts.messages.hide) {
					$(this).removeClass('open').addClass('closed').attr('title', opts.messages.show);
					//useUiIcon('.toggle-form','ui-icon-triangle-1-s');
					message.html(opts.messages.show);
					$('#' + target + '-fld').animate({
						opacity: 'hide',
						height: 'hide'
					}, 'slow');
					return false;
				}
				if (message.html() === opts.messages.show) {
					$(this).removeClass('closed').addClass('open').attr('title', opts.messages.hide);
					//useUiIcon('.toggle-form','ui-icon-triangle-1-n');
					message.html(opts.messages.hide);
					$('#' + target + '-fld').animate({
						opacity: 'show',
						height: 'show'
					}, 'slow');
					return false;
				}
				return false;
			});
			// handle delete confirmation
			$('.delete-confirm').live('click', function () {
				var delete_id = $(this).attr("id").replace(/del_/, '');
				$( "#" + opts.confirm_delete ).dialog({
					resizable: false,
					width: 400,
					modal: true,
					buttons: [
					          {
					        	  text: opts.messages.remove_confirm,
					        	  click: function() {
					        		  $( this ).dialog( "close" );
					        		  $('#frm-' + delete_id + '-item').animate({
					        			  opacity: 'hide',
					        			  height: 'hide',
					        			  marginBottom: '0px'
					        		  }, 'slow', function () { $(this).remove(); });
					        	  }
					          },
					          {
					        	  text: opts.messages.remove_cancel,
					        	  click: function() {
					        		  $( this ).dialog( "close" );
					        	  }
					          }
					     ]
					});
				return false;
			});
			// Attach a callback to add new checkboxes
			$('.add_ck').live('click', function () {
				$(this).parent().before(checkboxFieldHtml());
				useUiIcon('.remove','ui-icon-trash');
				useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				return false;
			});
			// Attach a callback to add new options
			$('.add_opt').live('click', function () {
				$(this).parent().before(selectFieldHtml('', false));
				useUiIcon('.remove','ui-icon-trash');
				useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				return false;
			});
			// Attach a callback to add new radio fields
			$('.add_rd').live('click', function () {
				$(this).parent().before(radioFieldHtml(false, $(this).parents('.frm-holder').attr('id')));
				useUiIcon('.remove','ui-icon-trash');
				useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				return false;
			});
			// Use ui-icon
			var useUiIcon = function (element,icon) {
				if (opts.use_ui_icon) {
					$(element).button({
						icons: {
							primary: icon
						},
						text: false
					});
				}
			}
			// Generate random unique id
			var unique_random = function () {
				var ts = Math.round((new Date()).getTime() / 1000);
				return Math.floor(Math.random()*ts);
			}
			// saves the serialized data to the server 
			var save = function () {
				var language = $('#language option:selected').val();
				if (opts.save_url) {
					$.ajax({
						type: "POST",
						url: opts.save_url + '&language=' + language,
						dataType: "json",
						data: $(ul_obj).serializeFormList({
							prepend: opts.serialize_prefix,
							anchor: opts.code_prefix
						}),
						success: function (r) {
							// TODO add external callback
							if(r.error) {
								$.jnotify(r.error, "error", true);
							} else {
								$.jnotify(r.status, 1000);
							}
						}
					});
				}
			};
		});
	};
})(jQuery);
/**
 * jQuery Form Builder List Serialization Plugin
 * Copyright (c) 2009 Mike Botsko, Botsko.net LLC (http://www.botsko.net)
 * Originally designed for AspenMSM, a CMS product from Trellis Development
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * Copyright notice and license must remain intact for legal use
 * Modified from the serialize list plugin
 * http://www.botsko.net/blog/2009/01/jquery_serialize_list_plugin/
 */
(function ($) {
	$.fn.serializeFormList = function (options) {
		// Extend the configuration options with user-provided
		var defaults = {
			anchor: 'options_',
			prepend: 'ul',
			is_child: false,
			attributes: ['class']
		};
		var opts = $.extend(defaults, options);
		if (!opts.is_child) {
			opts.prepend = '&' + opts.prepend;
		}
		var serialStr = '';
		// Begin the core plugin
		this.each(function () {
			var ul_obj = this;
			var li_count = 0;
			var c = 0;
			$(this).children().each(function () {
				for (att = 0; att < opts.attributes.length; att++) {
					var key = (opts.attributes[att] === 'class' ? 'cssClass' : opts.attributes[att]);
					var keycode = opts.anchor + $('#' + $(this).attr('id') + ' input[name=code]').val();
					serialStr += opts.prepend + '[structure][' + li_count + '][' + key + ']=' + encodeURIComponent($(this).attr(opts.attributes[att]));
					// append the form field values
					if (opts.attributes[att] === 'class') {
						serialStr += opts.prepend + '[structure][' + li_count + '][required]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.required').attr('checked'));
						switch ($(this).attr(opts.attributes[att])) {
						case 'input_text':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val());
								}
							});
							break;
						case 'select_date':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val());
								}
							});
							break;
						case 'textarea':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val());
								}
							});
							break;
						case 'checkbox':
							c = 0;
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val());
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val());
									c++;
								}
							});
							break;
						case 'radio':
							c = 0;
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val());
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val());
									c++;
								}
							});
							break;
						case 'select':
							c = 0;
							serialStr += opts.prepend + '[structure][' + li_count + '][multiple]=' + $('#' + $(this).attr('id') + ' input[name=multiple]').attr('checked');
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val());
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val());
									c++;
								}
							});
							break;
						case 'comment':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val());
								}
							});
							break; 
						}
					}
				}
				li_count++;
			});
		});
		return (serialStr);
	};
})(jQuery);