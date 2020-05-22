function doPost(e) {

  try {
    Logger.log(JSON.stringify(e)); // log the POST data in case we need to debug it
    record_data(JSON.parse(e.postData.contents));
    
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

/**
 * record_data inserts the data received from the html form submission
 * e is the data received from the POST
 */
function record_data(e) {
  //var lock = LockService.getDocumentLock();
  //lock.waitLock(30000); // hold off up to 30 sec to avoid concurrent writing
  /*
  var e = {
    "quoteID": "Test5",
    "products": {
        "abc": 3,
        "zyx": 5
    }
  }
  */
  
  try {
    
    var ss = SpreadsheetApp.openById("1YHPVqYjDaLw3pKWbKGVzUL-X_acWggLY0xYqB7UZ660");
    SpreadsheetApp.setActiveSpreadsheet(ss);
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var template = doc.getSheetByName("Quote Template");
    var sheet = template.copyTo(doc)
    sheet.setName(e.quoteID + "-" + 
                  new Date().toLocaleString());
    
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
      row.push("https://garyfung.typeform.com/to/dKm0Fm?supplierid=" + row[1])
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
  var headers = []
  for (const [key, value] of Object.entries(data)) {
    var header = key + " (" + value + ")";
    headers.push(header)
  }
  return headers
}

function getFieldFromData(field, data) {
  var values = data[field] || '';
  var output = values.join ? values.join(', ') : values;
  return output;
}
