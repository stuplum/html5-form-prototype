describe('Form', function() {

    var form;

    describe('Form constructor', function() {

        it('requires a form ID to be passed', function() {
            expect( function(){ new HTML5FORM.Form({ }); } ).toThrow('MissingArgument - formId is required');
        });


    });
});