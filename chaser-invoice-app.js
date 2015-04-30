Invoices = new Meteor.Collection('invoices');

if (Meteor.isClient) {

  Template.demo_invoices.helpers({
    invoices: function() {
      return Invoices.find({ Status: { $ne: 'PAID' } }, {sort: {DueDate: 1}});
    }
  });

  Template.registerHelper('formatDate', function(date) {
    return moment(date).format('MMM Do YYYY');
  });

}


if (Meteor.isServer) {

  var Xero = Meteor.npmRequire('xero');
  var RSA_PRIVATE_KEY = Assets.getText('privatekey.pem');
  var CONSUMER_KEY = 'AY4VNMCAPQP1KDOVIROXGCSCZYHEEA';
  var CONSUMER_SECRET = '5BBDOGBCL5YP5DJPOJYXAA3DIIB5TL';
  
  var apiCall = Async.runSync(function(done) {
    new Xero(CONSUMER_KEY, CONSUMER_SECRET, RSA_PRIVATE_KEY).call('GET', '/Invoices', null, function(err, data) {
      done(null, data);
    });
  });

  var xero_response = apiCall.result;
  
  if (xero_response && xero_response.Response && xero_response.Response.Invoices && xero_response.Response.Invoices.Invoice) {
    var invoices = xero_response.Response.Invoices.Invoice
    for (var i=0; i < invoices.length; i++) {
      var invoice = invoices[i]
      var previous = Invoices.findOne({'InvoiceID': invoice.InvoiceID});
      if (previous) {
        Invoices.update({_id: previous._id}, invoice);
      } else if (invoice.Status !== 'PAID') {
        Invoices.insert(invoice);
      }
    }
  }
}
