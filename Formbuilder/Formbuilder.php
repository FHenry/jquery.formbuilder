<?php

/**
 * @package 	jquery.Formbuilder
 * @author 		Michael Botsko
 * @copyright 	2009, 2012 Trellis Development, LLC
 *
 * This PHP object is the server-side component of the jquery formbuilder
 * plugin. The Formbuilder allows you to provide users with a way of
 * creating a formand saving that structure to the database.
 *
 * Using this class you can easily prepare the structure for storage,
 * rendering the xml file needed for the builder, or render the html of the form.
 *
 * This package is licensed using the Mozilla Public License 1.1
 *
 * We encourage comments and suggestion to be sent to mbotsko@trellisdev.com.
 * Please feel free to file issues at http://github.com/botskonet/jquery.formbuilder/issues
 * Please feel free to fork the project and provide patches back.
 */


/**
 * @abstract This class is the server-side component that handles interaction with
 * the jquery formbuilder plugin.
 * @package jquery.Formbuilder
 */
class Formbuilder {

	/**
	 * @var array Holds the form id and array form structure
	 * @access protected
	 */
	protected $_form_array;


	 /**
	  * Constructor, loads either a pre-serialized form structure or an incoming POST form
	  * @param array $containing_form_array
	  * @access public
	  */
	public function __construct($form = false){
		
		$form = is_array($form) ? $form : array();

		// Set the serialized structure if it's provided
		// otherwise, store the source
		if(array_key_exists('form_structure', $form)){
			$form['form_structure'] = json_decode($form['form_structure'], true);
			$this->_form_array = $form;
		}
		else if(array_key_exists('frmb', $form)){
			$_form = array();
			$_form['form_id'] = ($form['form_id'] == "undefined" ? false : $form['form_id']);
			$_form['form_structure'] = $form['frmb']; // since the form is from POST, set it as the raw array
			$this->_form_array = $_form;
		}
		return true;
	}


	/**
	 * Returns the form array with the structure encoded, for saving to a database or other store
	 *
	 * @access public
	 * @return array
	 */
	public function get_encoded_form_array(){
		return array('form_id'=>$this->_form_array['form_id'],'form_structure'=>json_encode($this->_form_array['form_structure']));
	}


	/**
	 * Prints out the generated json file with a content-type of application/json
	 *
	 * @access public
	 */
	public function render_json(){
		header("Content-Type: application/json");
		print json_encode( $this->_form_array );
	}


	/**
	 * Renders the generated html of the form.
	 *
	 * @param string $form_action Action attribute of the form element.
	 * @access public
	 * @uses generate_html
	 */
	public function render_html($form_action = false, $view_type = false, $parameters = false){
		print $this->generate_html($form_action, $view_type, $parameters);
	}


	/**
	 * Generates the form structure in html.
	 * 
	 * @param string $form_action Action attribute of the form element.
	 * @return string
	 * @access public
	 */
	public function generate_html($form_action = false, $view_type = false, $parameters = false){

		$html = '';
		
		if(is_array($this->_form_array['form_structure'])){
			if (! $form_action)
			{
				foreach($this->_form_array['form_structure'] as $field) {
					$html .= $this->loadField((array) $field, $view_type, $parameters);
				}
			}
			else
			{
				$form_action = $form_action ? $form_action : $_SERVER['PHP_SELF'];
				
				$html .= '<form class="frm-bldr" method="post" action="'.$form_action.'">' . "\n";
				$html .= '<ol>'."\n";
					
				foreach($this->_form_array['form_structure'] as $field){
					$html .= $this->loadField((array) $field);
				}
					
				$html .= '<li class="btn-submit"><input type="submit" name="submit" value="Submit" /></li>' . "\n";
				$html .=  '</ol>' . "\n";
				$html .=  '</form>' . "\n";
			}
		}

		return $html;

	}


	/**
	 * Parses the POST data for the results of the speific form values. Checks
	 * for required fields and returns an array of any errors.
	 *
	 * @access public
	 * @returns array
	 */
	public function process(){
		
		global $langs;

		$error		= array();
		$results 	= array();

		// Put together an array of all expected indices
		if(is_array($this->_form_array['form_structure'])){
			foreach($this->_form_array['form_structure'] as $field){
				
				$field = (array)$field;

				$field['required'] = $field['required'] == 'checked' ? true : false;

				if($field['cssClass'] == 'input_text' || $field['cssClass'] == 'textarea' || $field['cssClass'] == 'select_date'){

					$val = $this->getPostValue( $field['code'] );

					if($field['required'] && empty($val)){
						$error[] .= $langs->trans('ErrorFieldRequired',$field['values']) . '<br />' . "\n";
					} else {
						$results[ $field['code'] ] = $val;
					}
				}
				elseif($field['cssClass'] == 'radio' || $field['cssClass'] == 'select'){

					$val = $this->getPostValue( $field['code'] );

					if($field['required'] && empty($val)){
						$error[] .= $langs->trans('ErrorFieldRequired',$field['title']) . '<br />' . "\n";
					} else {
						$results[ $field['code'] ] = $val;
					}
				}
				elseif($field['cssClass'] == 'checkbox'){
					$field['values'] = (array)$field['values'];
					if(is_array($field['values']) && !empty($field['values'])){

						$at_least_one_checked = false;
						
						$i=0;

						foreach($field['values'] as $item){
							
							$elem_id = $field['code'].'-'.$i;

							$val = $this->getPostValue( $elem_id );

							if(!empty($val)){
								$at_least_one_checked = true;
							}

							$results[ $elem_id ] = $val;
							
							$i++;
						}

						if(!$at_least_one_checked && $field['required']){
							$error[] .= $langs->trans('ErrorFieldRequired',$field['title']) . '<br />' . "\n";
						}
					}
				} else { }
			}
		}

		$success = empty($error);

		return array('success'=>$success,'results'=>$results,'errors'=>$error);
		
	}


	//+++++++++++++++++++++++++++++++++++++++++++++++++
	// NON-PUBLIC FUNCTIONS
	//+++++++++++++++++++++++++++++++++++++++++++++++++


	/**
	 * Loads a new field based on its type
	 *
	 * @param array $field
	 * @access protected
	 * @return string
	 */
	protected function loadField($field, $view_type = false, $parameters = false){

		if(is_array($field) && isset($field['cssClass'])){

			switch($field['cssClass']){

				case 'input_text':
					return $this->loadInputText($field, $view_type, $parameters);
					break;
				case 'textarea':
					return $this->loadTextarea($field, $view_type, $parameters);
					break;
				case 'checkbox':
					return $this->loadCheckboxGroup($field, $view_type, $parameters);
					break;
				case 'radio':
					return $this->loadRadioGroup($field, $view_type, $parameters);
					break;
				case 'select':
					return $this->loadSelectBox($field, $view_type, $parameters);
					break;
				case 'select_date':
					return $this->loadSelectDate($field, $view_type, $parameters);
					break;
				case 'comment':
					return $this->loadComment($field, $view_type, $parameters);
					break;
			}
		}

		return false;

	}


	/**
	 * Returns html for an input type="text"
	 * 
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadInputText($field, $view_type = false, $parameters = false){

		$field_value = ( $this->getDataValue($field['code']) ? $this->getDataValue($field['code']) : $this->getPostValue($field['code']) );

		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['values'].'</td><td'.$colspan.'>';
			$html .= $field_value;
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['values'].'</span></td><td'.$colspan.'>';
			$html .= sprintf('<input type="text" id="%s" name="%s" value="%s" />' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</td></tr>' . "\n";
		}
		else
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
			
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
			$html .= sprintf('<label for="%s">%s</label>' . "\n", $field['code'], $field['values']);
			$html .= sprintf('<input type="text" id="%s" name="%s" value="%s" />' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</li>' . "\n";
		}

		return $html;
	}
	
	/**
	 * Returns html for an input select date
	 * 
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadSelectDate($field, $view_type = false, $parameters = false){
		
		global $conf, $langs;

		$field_value = ( $this->getDataValue($field['code']) ? $this->getDataValue($field['code']) : $this->getPostValue($field['code']) );

		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		$html.= '<script>';
		$html.= '$(function() {
					$( "#'.$field['code'].'" ).datepicker({
						showOn: "button",
						buttonImage: "'.DOL_URL_ROOT.'/theme/'.$conf->theme.'/img/calendar.png",
						buttonImageOnly: true,
						monthNames: tradMonths,
						monthNamesShort: tradMonthsMin,
						dayNames: tradDays,
						dayNamesMin: tradDaysMin,
						dateFormat: "'.$langs->trans("FormatDateShortJQuery").'"
					});
				});';
		$html.= '</script>';
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['values'].'</td><td'.$colspan.'>';
			$html .= $field_value;
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['values'].'</span></td><td'.$colspan.'>';
			$html .= sprintf('<input type="text" id="%s" name="%s" value="%s" />' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</td></tr>' . "\n";
		}
		else
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
			
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
			$html .= sprintf('<label for="%s">%s</label>' . "\n", $field['code'], $field['values']);
			$html .= sprintf('<input type="text" id="%s" name="%s" value="%s" />' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</li>' . "\n";
		}

		return $html;
	}


	/**
	 * Returns html for a <textarea>
	 *
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadTextarea($field, $view_type = false, $parameters = false){
		
		$field_value = ( $this->getDataValue($field['code']) ? $this->getDataValue($field['code']) : $this->getPostValue($field['code']) );
		
		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['values'].'</td><td'.$colspan.'>';
			$html .= dol_nl2br($field_value);
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['values'].'</span></td><td'.$colspan.'>';
			$html .= sprintf('<textarea id="%s" name="%s" rows="5" cols="50">%s</textarea>' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</td></tr>' . "\n";
		}
		else 
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
			
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
			$html .= sprintf('<label for="%s">%s</label>' . "\n", $field['code'], $field['values']);
			$html .= sprintf('<textarea id="%s" name="%s" rows="5" cols="50">%s</textarea>' . "\n",
									$field['code'],
									$field['code'],
									$field_value);
			$html .= '</li>' . "\n";
		}

		return $html;
	}


	/**
	 * Returns html for an <input type="checkbox"
	 *
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadCheckboxGroup($field, $view_type = false, $parameters = false){

		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['title'].'</td><td'.$colspan.'>';
			
			if(isset($field['values']) && is_array($field['values'])){
				$i=0;
				foreach($field['values'] as $item){
					
					// load data value
					$val = $this->getDataValue($field['code'].'-'.$i);
					if (! empty($val)) $html .= $this->getDataValue($field['code'].'-'.$i)."<br />";
					
					$i++;
				}
			}
			
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['title'].'</span></td><td'.$colspan.'>';
		}
		else 
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
			
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
	
			if(isset($field['title']) && !empty($field['title'])){
				$html .= sprintf('<span class="false_label">%s</span>' . "\n", $field['title']);
			}
		}
		
		if ($view_type != 'view')
		{
			if(isset($field['values']) && is_array($field['values'])){
				
				$html .= sprintf('<span class="multi-row clearfix">') . "\n";
				$i=0;
				foreach($field['values'] as $item){
	
					// set the default checked value
					$checked = $item['default'] == 'true' ? true : false;
	
					// load post value
					$val = ( $this->getDataValue($field['code'].'-'.$i) ? $this->getDataValue($field['code'].'-'.$i) : $this->getPostValue($field['code'].'-'.$i) );
					$checked = !empty($val);
	
					// if checked, set html
					$checked = $checked ? ' checked="checked"' : '';
	
					$checkbox 	= '<span class="row clearfix"><input type="checkbox" id="%s-'.$i.'" name="%s-'.$i.'" value="%s"%s /><label for="%s-'.$i.'">%s</label></span>' . "\n";
					$html .= sprintf($checkbox, $field['code'], $field['code'], $item['value'], $checked, $field['code'], $item['value']);
					
					$i++;
				}
				$html .= sprintf('</span>') . "\n";
			}
			
			if ($view_type == 'table') $html .= '</td></tr>' . "\n";
			else $html .= '</li>' . "\n";
		}

		return $html;

	}


	/**
	 * Returns html for an <input type="radio"
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadRadioGroup($field, $view_type = false, $parameters = false){
		
		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['title'].'</td><td'.$colspan.'>';
			
			if(isset($field['values']) && is_array($field['values'])){
				$i=0;
				foreach($field['values'] as $item){
					
					// load data value
					$html .= ( $this->getDataValue($field['code']) && $this->getDataValue($field['code']) == $item['value'] ? $this->getDataValue($field['code']) : '');
					
					$i++;
				}
			}
			
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['title'].'</span></td><td'.$colspan.'>';
		}
		else 
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
	
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
	
			if(isset($field['title']) && !empty($field['title'])){
				$html .= sprintf('<span class="false_label">%s</span>' . "\n", $field['title']);
			}
		}
		
		if ($view_type != 'view')
		{
			if(isset($field['values']) && is_array($field['values'])){
				$html .= sprintf('<span class="multi-row">') . "\n";
				$i=0;
				foreach($field['values'] as $item){
	
					// set the default checked value
					$checked = $item['baseline'] == 'checked' ? true : false;
	
					// load post value
					$val = ( $this->getDataValue($field['code']) && $this->getDataValue($field['code']) == $item['value'] ? $this->getDataValue($field['code']) : ($this->getPostValue($field['code']) && $this->getPostValue($field['code']) == $item['value'] ? $this->getPostValue($field['code']) : '') );
					$checked = ! empty($val) ? true : false;
	
					// if checked, set html
					$checked = $checked ? ' checked="checked"' : '';
				
					$radio = '<span class="row clearfix"><input type="radio" id="%s-'.$i.'" name="%1$s" value="%s"%s /><label for="%1$s-'.$i.'">%2$s</label></span>' . "\n";
					$html .= sprintf($radio,
											$field['code'],
											$item['value'],
											$checked);
					
					$i++;
				}
				$html .= sprintf('</span>') . "\n";
			}
	
			if ($view_type == 'table') $html .= '</td></tr>' . "\n";
			else $html .= '</li>' . "\n";
		}

		return $html;

	}


	/**
	 * Returns html for a <select>
	 * 
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadSelectBox($field, $view_type = false, $parameters = false){
		
		$html = '';
		
		if (is_array($parameters) && ! empty($parameters))
		{
			foreach($parameters as $key=>$value)
			{
				$$key=$value;
			}
		}
		
		if ($view_type == 'view')
		{
			$html .= '<tr><td>'.$field['title'].'</td><td'.$colspan.'>';
			
			if(isset($field['values']) && is_array($field['values'])){
				$i=0;
				foreach($field['values'] as $item){
					
					// load data value
					$html .= ( $this->getDataValue($field['code']) && $this->getDataValue($field['code']) == $item['value'] ? $this->getDataValue($field['code']) : '');
					
					$i++;
				}
			}
			
			$html .= '</td></tr>' . "\n";
		}
		else if ($view_type == 'table')
		{
			$field['required'] = $field['required'] == 'checked' ? ' class="fieldrequired"' : '';
			
			$html .= '<tr><td><span'.$field['required'].'>'.$field['title'].'</span></td><td'.$colspan.'>';
		}
		else 
		{
			$field['required'] = $field['required'] == 'checked' ? ' required' : false;
	
			
	
			$html .= sprintf('<li class="%s%s" id="fld-%s">' . "\n", $this->elemId($field['cssClass']), $field['required'], $field['code']);
	
			if(isset($field['title']) && !empty($field['title'])){
				$html .= sprintf('<label for="%s">%s</label>' . "\n", $field['code'], $field['title']);
			}
		}
		
		if ($view_type != 'view')
		{
			if(isset($field['values']) && is_array($field['values'])){
				$multiple = $field['multiple'] == "true" ? ' multiple="multiple"' : '';
				$html .= sprintf('<select class="flat" name="%s" id="%s"%s>' . "\n", $field['code'], $field['code'], $multiple);
	
				foreach($field['values'] as $item){
	
					// set the default checked value
					$checked = $item['baseline'] == 'checked' ? true : false;
	
					// load post value
					$val = ( $this->getDataValue($field['code']) && $this->getDataValue($field['code']) == $item['value'] ? $this->getDataValue($field['code']) : ($this->getPostValue($field['code']) && $this->getPostValue($field['code']) == $item['value'] ? $this->getPostValue($field['code']) : '') );
					$checked = ! empty($val) ? true : false;
	
					// if checked, set html
					$checked = $checked ? ' selected="selected"' : '';
	
					$option 	= '<option value="%s"%s>%s</option>' . "\n";
					$html .= sprintf($option, $item['value'], $checked, $item['value']);
				}
	
				$html .= '</select>' . "\n";
	
			}
			
			if ($view_type == 'table') $html .= '</td></tr>' . "\n";
			else $html .= '</li>' . "\n";
		}

		return $html;

	}
	
	/**
	 * Returns html for an comment <p>
	 * 
	 * @param array $field Field values from database
	 * @access protected
	 * @return string
	 */
	protected function loadComment($field, $view_type = false, $parameters = false){
		
		$html = '';
		
		if ($view_type == 'view')
		{
			
		}
		else if ($view_type == 'table')
		{
			if (is_array($parameters) && ! empty($parameters))
			{
				foreach($parameters as $key=>$value)
				{
					$$key=$value;
				}
			}
			
			$html .= '<tr><td>&nbsp;</td><td'.$colspan.'>'.$field['values'].'</td></tr>';
		}
		else
		{
			$html .= sprintf('<p>%s</p>', $field['values']) . "\n";
		}

		return $html;

	}


	/**
	 * Generates an html-safe element id using it's label
	 * 
	 * @param string $label
	 * @return string
	 * @access protected
	 */
	protected function elemId($label, $prepend = false){
		if(is_string($label)){
			$prepend = is_string($prepend) ? $this->elemId($prepend).'-' : false;
			return $prepend.strtolower( preg_replace("/[^A-Za-z0-9_]/", "", str_replace(" ", "_", $label) ) );
		}
		return false;
	}
	

	/**
	 * Attempts to load the POST value into the field if it's set (errors)
	 *
	 * @param string $key
	 * @return mixed
	 */
	protected function getPostValue($key){
		return array_key_exists($key, $_POST) ? $_POST[$key] : false;
	}
	
	/**
	 * Attempts to load the _data value into the field if it's set (errors)
	 *
	 * @param string $key
	 * @return mixed
	 */
	protected function getDataValue($key){
		if (is_array($this->_data) && ! empty($this->_data)) {
			return array_key_exists($key, $this->_data) ? $this->_data[$key] : false;
		}
	}
}
?>