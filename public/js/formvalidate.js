function validateForm() {
  var x = document.forms["myForm"]["fileName"].value;
  if (x == "") {
    alert("Name must be filled out");
    return false;
  }
}