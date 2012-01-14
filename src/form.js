var HTML5FORM = HTML5FORM || {};

HTML5FORM.form = Class.create({

    options: {},
    fields: [],

    initialize: function(options) {
        var _self = this;

        _self._createOptionsObjectFromArguments(options); // Mixin options object with default options, allows for customisation

        _self.form = $(_self.options.formId); // cache the FormHTMLElement

        _self._addNoValidateAttr(); // Add novalidate attribute to stop built in html5 validation

        _self.form.select('input:not([type="submit"])').each(function(el) { // select inputs from within the form that should be validated
            _self._registerFields(el); // create a fields object and add it to an array of fields
        });

        _self.form.onsubmit = _self.options.onSubmit.bind(_self); // bind the submithandler to the forms submit event

        _self.form.observe('form:validationSuccess', _self.options.onValidationSuccess); // bind the onValidation success handler to a custom event
    },

    _createOptionsObjectFromArguments: function(options) {
        var _self = this;

        _self.options = Object.extend({
            fieldValidator:      HTML5FORM.fieldValidator,
            onSubmit:            _self.validate,
            onValidationSuccess: function() { }
        }, options);
    },

    _addNoValidateAttr: function() {
        var _self = this;

        _self.form.writeAttribute('novalidate', 'novalidate');
    },

    _registerFields: function(element) {
        var _self           = this,
            _errorContainer = _self._addErrorContainer(element);

        _self.fields.push({
            id:         element.id,
            name:       element.name,
            type:       element.type,
            required:   element.hasAttribute('required'),
            pattern:    element.readAttribute('pattern'),
            element:    element,
            valid:      true,
            errorField: _errorContainer
        });
    },

    _addErrorContainer: function(field) {
        var _errorContainer = new Element('span', { // create a new span element to add the error messages too
                id: field.id + '-error'
            });

        _errorContainer.addClassName('error-message');
        field.insert({ after: _errorContainer }); // insert the new span element after the field

        return _errorContainer;
    },

    validate: function() {
        var _self = this, _invalidFields, _hasValidated;

        _self.fields.each(function(field) {
            var _required       = field.required,
                _value          = field.element.value,
                _shouldValidate = _required || !_required && !_value.empty(); // Only validate fields that are required of if not blank

            if (_shouldValidate) {
                field._validator = field._validator || new _self.options.fieldValidator(field); // create a new validator object
                field.valid      = field._validator.validate(_value); // validate with the value in the field
            }

            field.valid ? _self.clearError(field) : _self.addError(field); // if the field is valid clear any errors, if its invlaid add any errors
        });

        _invalidFields = _self.fields.findAll(function(field) { // check to see if any fields are invalid
            return !field.valid;
        });

        _hasValidated = _invalidFields.length === 0;

        if(_hasValidated) {
            _self.form.fire('form:validationSuccess'); // fire an event if the validation was successful
        }

        return _hasValidated;
    },

    addError: function(field) {
        var _fieldName = field.name,
            _errorMessage = field._validator.getErrorMessage(_fieldName);

        field.element.addClassName('field-error'); // add a classname to the field for styling
        field.errorField.update(_errorMessage); // update the error message
    },

    clearError: function(field) {
        field.element.removeClassName('field-error'); // remove classname if its present
        field.errorField.update(); // remove any previous error messages
    }
});

HTML5FORM.fieldValidator = Class.create({

    initialize: function(field) {
        this.pattern   = field.pattern;
        this.modifiers = field.modifiers || 'gi';
    },

    validate: function(value) {
        var _re      = new RegExp(this.pattern,this.modifiers), // create a new regex object from the pattern supplied in the html
            _isValid = _re.test(value), // test the regex
            _isBlank = value.empty();

        if (!_isValid) {
            this.message = _isBlank ? '"#{fieldName}" is a required field' : 'Please enter a valid "#{fieldName}"'; // change the error message dependant on the field being blank
        }

        return _isValid;
    },

    getErrorMessage: function(fieldName) {
        var _messageTemplate = new Template(this.message);

        return _messageTemplate.evaluate({
            fieldName: fieldName
        });
    }
});