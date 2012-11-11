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
			confirm_delete_field: 'confirm-delete-field',
			confirm_delete_option: 'confirm-delete-option',
			multiselect_locker: false,
			warning_multiselect: 'warning-multiselect',
			use_ui_icon: false,
			select_language: false,
			default_language: false,
			default_form_language: false,
			messages: {
				save				: "Save",
				add_new_field		: "Add New Field...",
				text				: "Text Field",
				numeric				: "Numeric Field",
				title				: "Title",
				select_date			: "Date",
				select_date_range	: "Date range",
				date_start_label	: "From",
				date_end_label		: "To",
				select_time			: "Time",
				select_time_range	: "Time range",
				time_start_label	: "From",
				time_end_label		: "To",
				comment				: "Comment",
				paragraph			: "Paragraph",
				checkboxes			: "Checkboxes",
				radio				: "Radio",
				select				: "Select List",
				text_field			: "Text Field",
				numeric_field		: "Numeric Field",
				label				: "Label",
				code				: "Code",
				comment_field		: "Comment Field",
				paragraph_field		: "Paragraph Field",
				wysiwyg				: "Wysiwyg Editor",
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
				align_label			: "Type of alignement",
				align_vertical		: "Vertically",
				align_horizontal	: "Horizontally",
				required			: "Required",
				show				: "Show",
				hide				: "Hide",
				enabled				: "Enabled",
				disabled			: "Disabled",
				locked				: "Locked"
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
				var load_url = opts.load_url;
				if (opts.default_language) {
					var language = opts.default_language;
					load_url += '&language=' + language;
				}
				$.getJSON(load_url, function(json) {
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
					select += '<option value="numeric">' + opts.messages.numeric + '</option>';
					select += '<option value="checkbox">' + opts.messages.checkboxes + '</option>';
					select += '<option value="radio">' + opts.messages.radio + '</option>';
					select += '<option value="select">' + opts.messages.select + '</option>';
					select += '<option value="select_date">' + opts.messages.select_date + '</option>';
					select += '<option value="select_date_range">' + opts.messages.select_date_range + '</option>';
					//select += '<option value="select_time">' + opts.messages.select_time + '</option>'; // FIXME timepicker is not stable
					//select += '<option value="select_time_range">' + opts.messages.select_time_range + '</option>'; // FIXME timepicker is not stable
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
					// Insert the language box
					if (opts.select_language) {
						$(ul_obj).before(opts.select_language);
					}
					// Insert the save button
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
						// Default element power button
						useUiIcon('#power-' + (last_id - 1),'ui-icon-power');
						$('#power-' + (last_id - 1)).removeClass('power-button-off')
													.addClass('power-button-on')
													.attr('title', opts.messages.enabled);
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
					var default_language = $.parseJSON(opts.default_form_language);
					// Parse json
					$(form_structure).each(function (i, val) {
						var fieldcode = this.code;
						var lang = form_language;
						if (typeof (lang[fieldcode]) === 'undefined') {
							lang = default_language;
						}
						// checkbox type
						if (this.type === 'checkbox') {
							options = [lang[fieldcode].title, fieldcode, this.align, this.active];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, lang[fieldcode].values[this.id], this.baseline]);
							});
						}
						// radio type
						else if (this.type === 'radio') {
							options = [lang[fieldcode].title, fieldcode, this.align, this.active];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, lang[fieldcode].values[this.id], this.baseline]);
							});
						}
						// select type
						else if (this.type === 'select') {
							options = [lang[fieldcode].title, this.multiple, fieldcode, this.align, this.active];
							values = [];
							$.each(this.values, function () {
								values.push([this.id, lang[fieldcode].values[this.id], this.baseline]);
							});
						}
						// date range type
						else if (this.type === 'select_date_range') {
							values = [lang[fieldcode].title, lang[fieldcode].title_start, lang[fieldcode].title_end, fieldcode, this.active];
						}
						// time range type
						else if (this.type === 'select_time_range') {
							values = [lang[fieldcode].title, lang[fieldcode].title_start, lang[fieldcode].title_end, fieldcode, this.active];
						}
						// textarea type
						else if (this.type === 'textarea') {
							values = [lang[fieldcode], fieldcode, this.wysiwyg, this.active];
						}
						else {
							values = [lang[fieldcode], fieldcode, this.active];
						}
						appendNewField(this.type, values, options, this.required);
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
					case 'numeric':
						appendNumericInput(values, required);
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
					case 'select_date_range':
						appendSelectDateRange(values, required);
						break;
					case 'select_time':
						appendSelectTime(values, required);
						break;
					case 'select_time_range':
						appendSelectTimeRange(values, required);
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
					active = values[2];
				}
					field += '<label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" />';
					help = '';
					required = 'disabled';
					appendFieldLi(opts.messages.comment_field, field, required, help, code, active);
				};
			// select single date
			var appendSelectDate = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
						active = values[2];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.select_date, field, required, help, code, active);
				};
			// select date range
			var appendSelectDateRange = function (values, required) {
					var title = '';
					var title_start = '';
					var title_end = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						title_start = values[1];
						title_end = values[2];
						code = values[3];
						active = values[4];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" name="title" type="text" value="' + title + '" /></div>';
					field += '<div class="frm-fld"><label>' + opts.messages.date_start_label + '</label>';
					field += '<input class="fld-title" id="title-start-' + last_id + '" name="title-start" type="text" value="' + title_start + '" /></div>';
					field += '<div class="frm-fld"><label>' + opts.messages.date_end_label + '</label>';
					field += '<input class="fld-title" id="title-end-' + last_id + '" name="title-end" type="text" value="' + title_end + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.select_date_range, field, required, help, code, active);
				};
			// select single time
			var appendSelectTime = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
						active = values[3];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.select_time, field, required, help, code, active);
				};
			// select date range
			var appendSelectTimeRange = function (values, required) {
					var title = '';
					var title_start = '';
					var title_end = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						title_start = values[1];
						title_end = values[2];
						code = values[3];
						active = values[4];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" name="title" type="text" value="' + title + '" /></div>';
					field += '<div class="frm-fld"><label>' + opts.messages.time_start_label + '</label>';
					field += '<input class="fld-title" id="title-start-' + last_id + '" name="title-start" type="text" value="' + title_start + '" /></div>';
					field += '<div class="frm-fld"><label>' + opts.messages.time_end_label + '</label>';
					field += '<input class="fld-title" id="title-end-' + last_id + '" name="title-end" type="text" value="' + title_end + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.select_time_range, field, required, help, code, active);
				};
			// single line input type="text"
			var appendTextInput = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
						active = values[2];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.text, field, required, help, code, active);
				};
			// multi-line textarea
			var appendTextarea = function (values, required) {
					var title = '';
					var code = '';
					var wysiwyg = 'disabled';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
						wysiwyg = ((values[2] && values[2] != 'undefined') ? values[2] : 'disabled');
						active = values[3];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.paragraph_field, field, required, help, code, active, false, wysiwyg);
				};
			// single line numeric input type="text"
			var appendNumericInput = function (values, required) {
					var title = '';
					var code = '';
					if (typeof (values) === 'object') {
						title = values[0];
						code = values[1];
						active = values[2];
					}
					field += '<div class="frm-fld"><label>' + opts.messages.label + '</label>';
					field += '<input class="fld-title" id="title-' + last_id + '" type="text" value="' + title + '" /></div>';
					help = '';
					appendFieldLi(opts.messages.numeric, field, required, help, code, active);
				};
			// adds a checkbox element
			var appendCheckboxGroup = function (values, options, required) {
					var title = '';
					var code = '';
					var align = 'horizontal';
					if (typeof (options) === 'object') {
						title = options[0];
						code = options[1];
						align = ((options[2] && options[2] != 'undefined') ? options[2] : 'horizontal');
						active = options[3];
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
					appendFieldLi(opts.messages.checkbox_group, field, required, help, code, active, align);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button', opacity: 0.6, cursor: 'move' }); // making the dynamically added option fields sortable.
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
					field = '<div>';
					field += '<input type="checkbox"' + (checked ? ' checked="checked"' : '') + ' />';
					field += '<input type="text" value="' + value + '" />';
					field += '<input type="hidden" name="unique_id" value="' + unique_id + '" />';
					field += '<a href="#" class="remove delete-confirm-option" title="' + opts.messages.remove_message + '">' + opts.messages.remove + '</a>';
					field += '<span class="move-button" title="' + opts.messages.move_message + '">' + opts.messages.move + '</span>';
					field += '</div>';
					useUiIcon('.remove','ui-icon-trash');
					useUiIcon('.move-button','ui-icon-triangle-2-n-s');
					return field;
				};
			// adds a radio element
			var appendRadioGroup = function (values, options, required) {
					var title = '';
					var code = '';
					var align = 'horizontal';
					if (typeof (options) === 'object') {
						title = options[0];
						code = options[1];
						align = ((options[2] && options[2] != 'undefined') ? options[2] : 'horizontal');
						active = options[3];
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
					appendFieldLi(opts.messages.radio_group, field, required, help, code, active, align);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button', opacity: 0.6, cursor: 'move' }); // making the dynamically added option fields sortable.
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
					field += '<a href="#" class="remove delete-confirm-option" title="' + opts.messages.remove_message + '">' + opts.messages.remove + '</a>';
					field += '<span class="move-button" title="' + opts.messages.move_message + '">' + opts.messages.move + '</span>';
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
					var align = 'horizontal';
					if (typeof (options) === 'object') {
						title = options[0];
						multiple = options[1] === 'checked' ? true : false;
						code = options[2];
						align = ((options[3] && options[3] != 'undefined') ? options[3] : 'horizontal');
						align = (multiple ? align : false);
						active = options[4];
					}
					field += '<div class="opt_group">';
					field += '<div class="frm-fld"><label>' + opts.messages.title + '</label>';
					field += '<input type="text" name="title" value="' + title + '" /></div>';
					field += '';
					field += '<div class="false-label">' + opts.messages.select_options + '</div>';
					field += '<div class="fields">';
					field += '<input type="checkbox" class="multiselect" name="multiple"' + (multiple ? ' checked="checked"' + (opts.multiselect_locker ? ' disabled="disabled"' : '') : '') + '>';
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
					appendFieldLi(opts.messages.select, field, required, help, code, active, align);
					
					$('.'+ opts.css_ol_sortable_class).sortable({ handle: '.move-button', opacity: 0.6, cursor: 'move' }); // making the dynamically added option fields sortable.
				};
			// Select field html, since there may be multiple
			var selectFieldHtml = function (values, multiple) {
				if (multiple) {
					return checkboxFieldHtml(values);
				} else {
					return radioFieldHtml(values);
				}
			};
			// Appends the new field markup to the editor
			var appendFieldLi = function (title, field_html, required, help, code, active = true, align = false, wysiwyg = false) {
					var reg = new RegExp(opts.code_prefix, "gi");
					if (required != 'disabled') {
						required = (required === 'checked' ? true : false);
					}
					var disabled = '';
					if (code.length > 0) {
						disabled = ' disabled="disabled"';
					}
					var alignClass = ' hideobject';
					if (align) {
						alignClass = ' frm-fld';
					}
					var powerClass = 'power-button-on';
					if (active == 'locked') {
						powerClass = 'power-button-locked';
					} else if (active == 'false') {
						powerClass = 'power-button-off';
					}
					var li = '';
					li += '<li id="frm-' + last_id + '-item" class="' + field_type + '">';
					li += '<div class="legend">';
					li += '<a id="frm-' + last_id + '" class="toggle-form" href="#">' + opts.messages.hide + '</a> ';
					li += '<div id="del-' + last_id + '" class="del-button delete-confirm-field" title="' + opts.messages.remove_message + '"><span>' + opts.messages.remove + '</span></div>';
					li += '<div id="power-' + last_id + '" class="power-button ' + powerClass + '">' + opts.messages.enabled + '</div> ';
					li += '<strong id="txt-title-' + last_id + '">' + title + '</strong></div>';
					li += '<div id="frm-' + last_id + '-fld" class="frm-holder">';
					li += '<div class="frm-elements">';
					if (required != 'disabled') {
						li += '<div class="frm-fld"><label for="required-' + last_id + '">' + opts.messages.required + '</label>';
						li += '<input class="required" type="checkbox" value="1" name="required-' + last_id + '" id="required-' + last_id + '"' + (required ? ' checked="checked"' : '') + ' /></div>';
					}
					if (wysiwyg) {
						li += '<div class="frm-fld"><label for="wysiwyg-' + last_id + '">' + opts.messages.wysiwyg + '</label>';
						li += '<input class="wysiwyg" type="checkbox" value="1" name="wysiwyg-' + last_id + '" id="wysiwyg-' + last_id + '"' + (wysiwyg != 'disabled' ? ' checked="checked"' : '') + ' /></div>';
					}
					li += '<div class="align-bloc' + alignClass + '"><label for="align-' + last_id + '">' + opts.messages.align_label + '</label>';
					li += '<input class="align" type="radio" value="horizontal" name="align-' + last_id + '" id="align-horizontal-' + last_id + '"' + (align != 'vertical' ? ' checked="checked"' : '') + ' />';
					li += ' ' + opts.messages.align_horizontal + ' ';
					li += '<input class="align" type="radio" value="vertical" name="align-' + last_id + '" id="align-vertical-' + last_id + '"' + (align == 'vertical' ? ' checked="checked"' : '') + ' />';
					li += ' ' + opts.messages.align_vertical + ' ';
					li += '</div>';
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
					
					// Use ui-icon
					if (active == 'locked') {
						$('#power-' + last_id).attr('title', opts.messages.locked);
						useUiIcon('#power-' + last_id,'ui-icon-locked');
					} else if (active == 'false') {
						$('#power-' + last_id).attr('title', opts.messages.disabled);
						useUiIcon('#power-' + last_id,'ui-icon-power');
					} else {
						$('#power-' + last_id).attr('title', opts.messages.enabled);
						useUiIcon('#power-' + last_id,'ui-icon-power');
					}
					
					useUiIcon('.del-button','ui-icon-trash');
					useUiIcon('.toggle-form','ui-icon-triangle-1-n');
					useUiIcon('.add','ui-icon-plus');
					useUiIcon('.remove','ui-icon-trash');
					useUiIcon('.move-button','ui-icon-triangle-2-n-s');
					
					last_id++;
				};
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
			// handle field on/off/locked
			$('.power-button').live('click', function () {
				if ($(this).hasClass('power-button-on')) {
					useUiIcon(this,'ui-icon-locked');
					$(this).removeClass('power-button-on')
							.addClass('power-button-locked')
							.attr('title', opts.messages.locked);
				} else if ($(this).hasClass('power-button-locked')) {
					useUiIcon(this,'ui-icon-power');
					$(this).removeClass('power-button-locked')
							.addClass('power-button-off')
							.attr('title', opts.messages.disabled);
				} else if ($(this).hasClass('power-button-off')) {
					useUiIcon(this,'ui-icon-power');
					$(this).removeClass('power-button-off')
							.addClass('power-button-on')
							.attr('title', opts.messages.enabled);
				}
			});
			// handle field delete confirmation
			$('.delete-confirm-field').live('click', function () {
				var delete_id = $(this).attr("id").replace(/del-/, '');
				var obj = $('#frm-' + delete_id + '-item');
				$( "#" + opts.confirm_delete_field ).dialog({
					resizable: false,
					width: 400,
					modal: true,
					buttons: [
					          {
					        	  text: opts.messages.remove_confirm,
					        	  click: function() {
					        		  $(this).dialog("close");
					        		  obj.animate({
					        			  opacity: 'hide',
					        			  height: 'hide',
					        			  marginBottom: '0px'
					        		  }, 'slow', function () { $(this).remove(); });
					        	  }
					          },
					          {
					        	  text: opts.messages.remove_cancel,
					        	  click: function() {
					        		  $(this).dialog("close");
					        	  }
					          }
					     ]
					});
				return false;
			});
			// handle option delete confirmation
			$('.delete-confirm-option').live('click', function () {
				var obj = $(this).parent('div');
				$( "#" + opts.confirm_delete_option ).dialog({
					resizable: false,
					width: 400,
					modal: true,
					buttons: [
					          {
					        	  text: opts.messages.remove_confirm,
					        	  click: function() {
					        		  $(this).dialog("close");
					        		  obj.animate({
					        			  opacity: 'hide',
					        			  height: 'hide',
					        			  marginBottom: '0px'
					        		  }, 'fast', function () { $(this).remove(); });
					        		  return false;
					        	  }
					          },
					          {
					        	  text: opts.messages.remove_cancel,
					        	  click: function() {
					        		  $(this).dialog("close");
					        	  }
					          }
					     ]
					});
				return false;
			});
			// handle selection multiple warning
			$('.multiselect').live('click', function () {
				if ( $(this).attr('checked') ) {
					if (opts.multiselect_locker) {
						$( "#" + opts.warning_multiselect ).dialog({
							resizable: false,
							width: 400,
							modal: true,
							buttons: {
				                Ok: function() {
				                    $( this ).dialog( "close" );
				                }
				            }
						});
					}
					$(this).parent().find(':radio').each(function() {
						$(this).after('<input type="checkbox">');
						$(this).remove();
					});
					$(this).parents('.frm-elements').find('.align-bloc').each(function() {
						$(this).addClass('frm-fld').show();
					});
				} else {
					$(this).parent().find(':checkbox').each(function() {
						if ($(this).attr('name') != 'multiple') {
							$(this).after('<input type="radio">');
							$(this).remove();
						}
					});
					$(this).parents('.frm-elements').find('.align-bloc').each(function() {
						$(this).removeClass('frm-fld').hide();
					});
				}
			});
			// Attach a callback to add new checkboxes
			$('.add_ck').live('click', function () {
				$(this).parents('.frm-elements').find('ol').append(checkboxFieldHtml());
				useUiIcon('.remove','ui-icon-trash');
				useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				return false;
			});
			// Attach a callback to add new options
			$('.add_opt').live('click', function () {
				var parentElement = $(this).parents('.frm-elements');
				var multiple = (parentElement.find('.multiselect').attr('checked') ? true : false);
				parentElement.find('ol').append(selectFieldHtml('', multiple));
				useUiIcon('.remove','ui-icon-trash');
				useUiIcon('.move-button','ui-icon-triangle-2-n-s');
				return false;
			});
			// Attach a callback to add new radio fields
			$('.add_rd').live('click', function () {
				$(this).parents('.frm-elements').find('ol').append(radioFieldHtml(false, $(this).parents('.frm-holder').attr('id')));
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
				var save_url = opts.save_url;
				if (opts.select_language) {
					var language = $('#language option:selected').val();
					save_url += '&language=' + language;
				} else if (opts.default_language) {
					var language = opts.default_language;
					save_url += '&language=' + language;
				}
				if (opts.save_url) {
					$.ajax({
						type: "POST",
						url: save_url,
						dataType: "json",
						data: $(ul_obj).serializeFormList({
							prepend: opts.serialize_prefix,
							anchor: opts.code_prefix
						}),
						success: function (r) {
							if(r.error) {
								$.jnotify(r.error, "error", true);
							} else {
								if (opts.multiselect_locker) {
									$('.multiselect').each(function () {
										if ($(this).attr('checked')) {
											$(this).attr('disabled', 'disabled');
										}
									});
								}
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
					var key = (opts.attributes[att] === 'class' ? 'type' : opts.attributes[att]);
					var keycode = opts.anchor + $('#' + $(this).attr('id') + ' input[name=code]').val();
					serialStr += opts.prepend + '[structure][' + li_count + '][' + key + ']=' + encodeURIComponent($(this).attr(opts.attributes[att]));
					// append the form field values
					if (opts.attributes[att] === 'class') {
						var powerbutton = $('#' + $(this).attr('id') + ' .power-button');
						if (powerbutton.hasClass('power-button-on')) {
							serialStr += opts.prepend + '[structure][' + li_count + '][active]=true';
						} else if (powerbutton.hasClass('power-button-locked')) {
							serialStr += opts.prepend + '[structure][' + li_count + '][active]=locked';
						} else if (powerbutton.hasClass('power-button-off')) {
							serialStr += opts.prepend + '[structure][' + li_count + '][active]=false';
						}
						serialStr += opts.prepend + '[structure][' + li_count + '][required]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.required').attr('checked'));
						switch ($(this).attr(opts.attributes[att])) {
						case 'input_text':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'numeric':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'select_date':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'select_date_range':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else if ($(this).attr('name') === 'title-start') {
									serialStr += opts.prepend + '[language][' + keycode + '][title_start]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else if ($(this).attr('name') === 'title-end') {
									serialStr += opts.prepend + '[language][' + keycode + '][title_end]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'select_time':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'select_time_range':
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else if ($(this).attr('name') === 'title-start') {
									serialStr += opts.prepend + '[language][' + keycode + '][title_start]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else if ($(this).attr('name') === 'title-end') {
									serialStr += opts.prepend + '[language][' + keycode + '][title_end]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'textarea':
							serialStr += opts.prepend + '[structure][' + li_count + '][wysiwyg]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.wysiwyg').attr('checked'));
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else {
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
							});
							break;
						case 'checkbox':
							c = 0;
							serialStr += opts.prepend + '[structure][' + li_count + '][align]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.align:checked').val());
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
									c++;
								}
							});
							break;
						case 'radio':
							c = 0;
							serialStr += opts.prepend + '[structure][' + li_count + '][align]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.align:checked').val());
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
									c++;
								}
							});
							break;
						case 'select':
							c = 0;
							serialStr += opts.prepend + '[structure][' + li_count + '][multiple]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input[name=multiple]').attr('checked'));
							if ($('#' + $(this).attr('id') + ' input[name=multiple]').attr('checked')) {
								serialStr += opts.prepend + '[structure][' + li_count + '][align]=' + encodeURIComponent($('#' + $(this).attr('id') + ' input.align:checked').val());
							}
							$('#' + $(this).attr('id') + ' input[type=text]').each(function () {
								if ($(this).attr('name') === 'code') {
									serialStr += opts.prepend + '[structure][' + li_count + '][code]=' + keycode;
								}
								else if ($(this).attr('name') === 'title') {
									serialStr += opts.prepend + '[language][' + keycode + '][title]=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
								}
								else {
									var keyid = $(this).next().val();
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][id]=' + keyid;
									serialStr += opts.prepend + '[structure][' + li_count + '][values][' + c + '][baseline]=' + $(this).prev().attr('checked');
									serialStr += opts.prepend + '[language][' + keycode + '][values][' + keyid + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
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
									serialStr += opts.prepend + '[language][' + keycode + ']=' + encodeURIComponent($(this).val().replace(/"/g, "'"));
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