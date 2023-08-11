document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email(isReply = false, data = {}) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individualemail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  if (isReply == true) {
    console.log(data);
    document.querySelector('#compose-recipients').value = data.sender;
    document.querySelector('#compose-subject').value = "Re: " + data.subject;
    document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote: \n ${data.body} \n`;
  }
  else {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  document.querySelector('#compose-form').onsubmit = () => {
    recipientsFromForm = document.querySelector('#compose-recipients').value;
    subjectFromForm = document.querySelector('#compose-subject').value;
    bodyFromForm = document.querySelector('#compose-body').value;
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipientsFromForm,
        subject: subjectFromForm,
        body: bodyFromForm
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
      });
    return false;
  };

}
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#individualemail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails
      console.log(emails);

      // checking if there are one or more emails or not 
      if (emails.length == 0) {
        const element = document.createElement('div');
        element.innerHTML = "sorry no emails yet :)";
        document.querySelector('#emails-view').append(element);
        return;
      }

      //iterating on email to add on page
      emails.forEach(email => {
        const emailDate = email.timestamp
        const emailBody = email.body;

        // assiging the archive button 
        const archiveBtn = email.archived ? "Unarchive It" : "Archive It"
        // assigning the color
        var color = "light";
        if (email.read == true) {
          color = "secondary"
        }

        // checking is the mailbox or sent or some other due to from and to thing
        const element = document.createElement('div');
        if (mailbox === 'sent') {
          const recipients = email.recipients;
          element.innerHTML = `<div class="card m-2">
            <div class="card-body">
              <h5 class="card-title">Sent To : ${recipients} </h5>
              <p class="card-text">${emailBody}</p>
              <p class="card-text">${emailDate}</p>
            </div>
          </div>`;
        }
        else {
          const sender = email.sender;
          element.innerHTML = `<div class="card bg-${color} m-2">
        <div class="card-body">
          <h5 class="card-title">Received From : ${sender} </h5>
          <p class="card-text">${emailBody}</p>
          <p class="card-text">${emailDate}</p>
          <a id="Archive" class="btn btn-primary ">${archiveBtn} </a> 
          </div>
          </div>`;
          // handeling the archive stuff
          const archive = element.querySelector("#Archive");

          archive.addEventListener('click', (event) => {
            console.log(email.id);
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: email.archived ? false : true
              })
            })
            if (email.archived) {
              alert("Email Unrchived!!")
            }
            else {
              alert("Email Archived!!")
            }
            load_mailbox('inbox');
            event.stopPropagation();
          })
        }

        document.querySelector('#emails-view').append(element);


        // if the user click on the specific email
        element.addEventListener('click', function () {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          })
          load_email(email.id, mailbox)
        });
      });
    });
}

function load_email(emailId, mailbox) {

  // show indemail view and hide others
  document.querySelector('#individualemail-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${emailId}`)
    // Put response into json form
    .then(response => response.json())
    .then(data => {
      // Log data to the console
      console.log(data);

      const element = document.querySelector('#individualemail-view');

      // checking if the mailbox is sent for diff template for div 
      if (mailbox == "sent") {
        element.innerHTML = `<div class="card">
        <div class="card-header">
        <strong>From: ${data.sender}</strong> 
       </div>
       <div class="card-body">
         <p class="card-title"><strong>To: </strong> ${data.recipients}</p>
         <p class="card-text"><strong>Subject: </strong> ${data.subject}</p>
         <p class="card-text"><strong>TimeStamp: </strong> ${data.timestamp}</p>
       </div>
       <div class="card-body py-3">
           <p class="card-text "><strong>Body: </strong> ${data.body}</p>
       </div>
       </div>`;
      }
      // for other mailboxes
      else {
        element.innerHTML = `<div class="card">
        <div class="card-header">
        <strong>From: ${data.sender}</strong> 
       </div>
       <div class="card-body">
         <p class="card-title"><strong>To: </strong> ${data.recipients}</p>
         <p class="card-text"><strong>Subject: </strong> ${data.subject}</p>
         <p class="card-text"><strong>TimeStamp: </strong> ${data.timestamp}</p>
         <a id="reply" class="btn btn-primary">Reply </a>
       </div>
       <div class="card-body py-3">
           <p class="card-text "><strong>Body: </strong> ${data.body}</p>
       </div>
       </div>`;

        const reply = element.querySelector("#reply");
        reply.addEventListener("click", () => {

          compose_email(true, data);

        })
      }
    });

}