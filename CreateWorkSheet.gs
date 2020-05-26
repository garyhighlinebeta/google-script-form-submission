var typeFormId;
var typeFormURL;
var webhookURL = "https://script.google.com/macros/s/AKfycbyAUjOe75Zb14W1pONKDSOufrgEpySoF4KMu3pdRpij5N-98Mr0/exec";
var spreadsheetid = "1YHPVqYjDaLw3pKWbKGVzUL-X_acWggLY0xYqB7UZ660";

function doPost(e) {
  
/*
 var e = 
  {"postData":
  {"contents":
  `
   {"event_id":"01E997KPF0FJ2QWG0Y89V7BFR7","event_type":"form_response","form_response":{"form_id":"iZCOkx","token":"3wer8a4d4zerhr1y1bn3wer9i9b0onq9","landed_at":"2020-05-26T19:33:34Z","submitted_at":"2020-05-26T19:33:36Z","hidden":{"supplierid":"3","quoteid":"Test5"},"definition":{"id":"iZCOkx","title":"New Quote","fields":[{"id":"qiwJ1ar2WgQQ","title":"abc","type":"short_text","ref":"c8caa56afc6c0cce","properties":{}},{"id":"fRxy4rsWvZxh","title":"zyx","type":"short_text","ref":"09aa72ac17fbbe20","properties":{}}]},"answers":[{"type":"text","text":"77","field":{"id":"qiwJ1ar2WgQQ","type":"short_text","ref":"c8caa56afc6c0cce"}},{"type":"text","text":"455","field":{"id":"fRxy4rsWvZxh","type":"short_text","ref":"09aa72ac17fbbe20"}}]}}
   `
  }}

  var e = 
  {"postData":
  {"contents":
  `{
      "quoteID": "Test5",
      "products": {
        "abc": 3,
        "zyx": 5
      }
    }`
  }}*/

  try {
    Logger.log(JSON.stringify(e)); // log the POST data in case we need to debug it

    //parses input
    var input = JSON.parse(e.postData.contents);
    
    if(input.event_id){
      handleWebhook(input)
      return;
    }
    
    //create new TypeForm
    createTypeForm(input);
    
    //setup TypeForm webhook
    createTypeFormWebhook();
    
    //create new worksheet
    record_data(input);
    
    return ContentService    // return json success results
          .createTextOutput(
            JSON.stringify({"result":"success",
                            "data": JSON.parse(e.postData.contents) }))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(error) { // if error return this
    Logger.log(error);
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": error}))
          .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleWebhook(input) {
  var answers = input.form_response.answers
  var supplierid = input.form_response.hidden.supplierid
  var quoteid = input.form_response.hidden.quoteid
  
  //setup sheet
  var ss = SpreadsheetApp.openById(spreadsheetid);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName(quoteid);
  var searchColumn = sheet.getRange(1,2,sheet.getLastRow(),1).getValues()
  var rowIndex =1;  //first row is header and sheet counts starting at 1
  for(; rowIndex<searchColumn.length;rowIndex++){
    if(searchColumn[rowIndex]==supplierid){ break;}
  }

  var answersRow = answers.map(
    p => p.text
  );
  
  if(rowIndex !=1) {
    sheet.getRange(rowIndex+1, 6, 1,answersRow.length).setValues([answersRow]);
  }
}

function createTypeFormWebhook() {
  var url = "https://api.typeform.com/forms/" + typeFormId + "/webhooks/sherpa" ;  
  var payload = {
    "url":webhookURL,
    "enabled":true
  }
  var options = {
  'method' : 'put',
  'contentType': 'application/json',
    'headers' : {
      'Authorization': 'Bearer 7s8v3nH7XahEjx5spYddRS7kQVkkZbdumvtqmWzh7ywv'
    },
  'payload' : JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url, options)
}

function createTypeForm(input) {

  var url = "https://api.typeform.com/forms";  
  var payload = {
    "title": "New Quote",
    "hidden":["supplierid","quoteid"]
  };
  var fields = [];
  var products = getQuestionLabel(input.products);
  for(i=0;i<products.length;i++) {
    fields.push({
      "title":products[i],
      "validations": {
        "required": false
      },
      "type": "short_text"
    });
  }
  payload.fields = fields;

  var options = {
  'method' : 'post',
  'contentType': 'application/json',
    'headers' : {
      'Authorization': 'Bearer 7s8v3nH7XahEjx5spYddRS7kQVkkZbdumvtqmWzh7ywv'
    },
  'payload' : JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url, options)
  var responseObj = JSON.parse(response.getContentText());
  typeFormId = responseObj.id;
  typeFormURL = responseObj._links.display;
}

/**
 * record_data inserts the data received from the html form submission
 * e is the data received from the POST
 */
function record_data(e) {
  //var lock = LockService.getDocumentLock();
  //lock.waitLock(30000); // hold off up to 30 sec to avoid concurrent writing
  
  try {
    
    var ss = SpreadsheetApp.openById(spreadsheetid);
    SpreadsheetApp.setActiveSpreadsheet(ss);
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var template = doc.getSheetByName("Quote Template");
    var sheet = template.copyTo(doc)
    sheet.setName(e.quoteID);
    //new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    var headers = getDataColumns(e.products);
    headers = ["Supplier name","Supplier ID", "Supplier email","Quote URL","Status"].concat(headers)
    Logger.log(headers);    
    
    //set the header row
    sheet.getRange(1,1,1,headers.length) //(start row, start column, number of rows, number of columns
    .setValues([headers])
    
    //create rows below header
    var supplier_data = [["Supplier1","1","gary.fung@highlinebeta.com"],
                         ["Supplier2","2","gary.fung@highlinebeta.com"],
                         ["Supplier3","3","ravi.pilla@evolv.group"],
                         ["Supplier4","4","jason.h@evolv.group"]]
    
    var data=[];
    for(i=0;i<supplier_data.length;i++) {
      var row = supplier_data[i].slice();
      row.push(typeFormURL + "?supplierid=" + row[1] + "&quoteid="+ e.quoteID)
      data.push(row)
    }
    
    sheet.getRange(2,1,data.length,4) //(start row, start column, number of rows, number of columns
    .setValues(data)
  }
  catch(error) {
    Logger.log(error);
  }
  finally {
    //lock.releaseLock();
    return;
  }

}

function getDataColumns(data) {
  var headers = [];
  for (const [key, value] of Object.entries(data)) {
    var header = key + " (" + value + ")";
    headers.push(header)
  }
  return headers;
}

function getQuestionLabel(data) {
  var labels = [];
    for (const [key, value] of Object.entries(data)) {
    var label = key + " (Quantity = " + value + ")";
    labels.push(label)
  }
  return labels;
}


