// ---------------------------------------------- EDIT ACCOUNT ----------------------------------------------
// Populate data to make it a prefilled form and ready to be edited
document.addEventListener('DOMContentLoaded', async function () {
        try {
          const response = await fetchWithAuth('/account');  // ------------------------------------------------- headers in jwtutility.js
            if (response.ok) { // response && response.ok
                const user = await response.json(); // Parse the JSON response
                // Populate profile info
                document.querySelector('.user-name').textContent = user.name; // Update user name in profile info
                document.querySelector('.h3 .user-name').textContent = user.name; // Update user name in another section
                
                // Prefill edit form fields
                document.getElementById('edit-name').value = user.name;  // Prefill name field
                document.getElementById('edit-birth-date').value = user.dob.split('T')[0]; // Prefill birth date field
                document.getElementById('edit-email').value = user.email; // Prefill email field

                // Store original user data
                originalUserData = {
                  name: user.name,
                  dob: user.dob.split('T')[0],
                  email: user.email
                };
                
                // Update other elements with the user's name
                document.querySelectorAll('.review-info .user-name, .comment-user-info .user-name').forEach(element => {
                    element.textContent = user.name;
                });

                // Fetch and update total quizzes taken
                await fetchTotalQuizzesTaken();

            } else {
                console.error('Failed to fetch user data'); // Log error if user data fetch fails
            }
        } catch (error) {
            console.error('Error:', error); // Log any other errors that occur
        }
    
    // Toggle visibility for edit account details
    document.getElementById('edit-icon').addEventListener('click', function () {
      const editAccountDetails = document.getElementById('edit-account-details');
      if (editAccountDetails.style.display === 'block') {
        editAccountDetails.style.display = 'none'; // Hide edit form if already visible
      } else {
        editAccountDetails.style.display = 'block'; // Show edit form if not visible
        
        // Clear password fields 
        document.getElementById('current-password').value = ''; 
        document.getElementById('edit-password').value = '';
        document.getElementById('edit-confirm-password').value = '';
    }  
  });
    
    // Handle form submission
    document.getElementById('save-changes').addEventListener('click', async function (event) {
        event.preventDefault(); // Prevent the default form submission behavior
        
        const currentPassword = document.getElementById('current-password').value;  // Get current password value
        const newPassword = document.getElementById('edit-password').value;  // Get new password value
        const confirmNewPassword = document.getElementById('edit-confirm-password').value; // Get confirm new password value
  
        // Collect updated user data from form fields
        const updatedUserData = {
            name: document.getElementById('edit-name').value,
            dob: document.getElementById('edit-birth-date').value,
            email: document.getElementById('edit-email').value,
        };
        
        // Validate password fields
        if (currentPassword && (!newPassword || !confirmNewPassword)) {
            alert('To update password, you must enter the new password and confirm new password');
            return;
        }
        
        // Check if new passwords match
        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                alert('New passwords do not match');
                return;
            }

            if (newPassword === currentPassword) {
              alert('New Password cannot be the same as the current password');
              return;
            }
            updatedUserData.currentPassword = currentPassword;
            updatedUserData.newPassword = newPassword;
            updatedUserData.confirmNewPassword = confirmNewPassword;
        }

        // Check if no changes were made
        if (updatedUserData.name === originalUserData.name && updatedUserData.dob === originalUserData.dob && updatedUserData.email === originalUserData.email && !newPassword && !confirmNewPassword) {
          alert('No changes were detected. Click on the edit icon to close.');
          return;
        }
        
        try {
            const response = await fetchWithAuth(`/account`, { // ------------------------------------------------- headers in jwtutility.js
                method: 'PUT',
                body: JSON.stringify(updatedUserData)
            });

            if (response.ok) { // response && response.ok
                const updatedUser = await response.json();  // Parse the JSON response
                alert('User details updated successfully');
  
                const profileInfoUserName = document.querySelector('.profile-info .user-name');
                if (profileInfoUserName) {
                    profileInfoUserName.textContent = updatedUser.name;  // Update user name in profile info
                } else {
                    console.error('Profile info user name element not found');
                }

                document.querySelectorAll('.review-info .user-name, .comment-user-info .user-name').forEach(element => {
                    if (element) {
                        element.textContent = updatedUser.name; // Update user name in other sections
                    } else {
                        console.error('Element for updating user name not found');
                    }
                });
                window.location.reload(); // Reload the page
                
                // Close the edit fields
                document.getElementById('edit-account-details').style.display = 'none';
            
              } else {
                const errorData = await response.json();
                if (errorData.message === 'Current password is incorrect') {
                  alert(`${errorData.message}`); // Notify user if current password is incorrect
                } else if (errorData.message === 'Email is already in use') {
                  alert(`${errorData.message}`); // Notify user if email is already in use
                } else if (errorData.message.length > 0) {
                  alert(`${errorData.errors.join('\n')}`); // Display validation errors
                } else {
                  alert(`${errorData.message}`);  // Display other error messages
                }
            }
        } catch (error) {
            console.error('Error:', error);  // Log any other errors that occur
        }
    });
  });
  
    
  // ---------------------------------------------- UPLOAD PROFILE PICTURE ----------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
      fetchUserProfile(); // Fetch user profile picture on page load
  });
  
  async function fetchUserProfile() {
    try {
      const response = await fetchWithAuth(`/account/profile`); // ------------------------------------------------- headers in jwtutility.js
      if (response.ok) { // response && response.ok
        const data = await response.json(); // Parse the JSON response
        if (data.profilePic) {
          document.getElementById('profile-pic').src = data.profilePic; // Update profile picture
        }
      } else {
        console.error('Failed to fetch user profile'); // Log error if profile fetch fails
      }
    } catch (error) {
      console.error('Error fetching user profile:', error); // Log any other errors that occur
    }
  }
  
  function triggerFileInput() { // Trigger file input click event
    // const token = getToken();
    // if (!token) {
    //   alert('Please log in first to upload your profile picture.');
    //   window.location.href = 'Login.html';
    //   return;
    // }
    document.getElementById('file-input').click();
  }
  
  function previewImage(event) {
    const file = event.target.files[0]; // Get the selected file from the input
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Image = e.target.result; // Get the base64 encoded image
        document.getElementById('profile-pic').src = base64Image; // Preview the selected image
        uploadImageToServer(base64Image); // Upload the image to the server
      }
      reader.readAsDataURL(file); // Read the file as a Data URL
    }
  }
  
  async function uploadImageToServer(base64Image) {
    try {
      console.log('Uploading image...');
      const response = await fetchWithAuth(`/account/uploadProfilePic`, { // ------------------------------------------------- headers in jwtutility.js
        method: 'POST',
        body: JSON.stringify({ profilePic: base64Image })  // Send base64 image in the request body
      });
  
      if (response.ok) { // response && response.ok
        alert('Profile picture updated successfully'); // Notify user of successful upload
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);  // Log error details if upload fails
        alert(`Failed to update profile picture: ${errorData.message || 'Unknown error'}`); // Notify user of upload failure
      }
    } catch (error) {
      console.error('Error uploading image:', error); // Log any other errors that occur
      alert('Error uploading image');// Notify user of upload error
    }
  }
  
      
  // ---------------------------------------------- DELETE ACCOUNT ----------------------------------------------
  // Function to confirm account deletion
  function confirmDeleteAccount() {
    // const token = getToken();
    
    // if (!token) {
    //   alert('No user is logged in');
    //   return;
    // }
  
    document.getElementById('deleteModal').style.display = 'block'; // Display the delete modal
  }
  
  // Function to close the delete modal
  function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none'; // Hide the delete modal
  }
  
  // Function to delete account with password authorization
  async function deleteAccount() {
    // const token = getToken();
    const password = document.getElementById('delete-password').value; // Get the password for account deletion
    // if (!password) {
    //     alert('Please enter your password');
    //     return;
    // }

    try {
        const response = await fetchWithAuth('/account', { // ------------------------------------------------- headers in jwtutility.js
            method: 'DELETE',
            body: JSON.stringify({ password: password }) // Send the password in the request body
        });

        if (response.ok) { // response && response.ok
            alert('Account deleted successfully');
            sessionStorage.removeItem('token');  // Clear the token from session storage
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('role');
            window.location.href = 'Login.html'; // Redirect to the index page
        } else {
            const errorData = await response.json();
            alert(errorData.message); // Notify user of any errors
        }
    } catch (error) {
        console.error('Error:', error); // Log any other errors that occur
    } finally {
        closeDeleteModal();  // Close the delete modal
    }
}

  
  // ---------------------------------------------- LOG OUT --------------------------------------------------------------
  function confirmLogout() {
    // const token = getToken();
    // if (!token) {
    //   alert('No user is logged in.');
    //   return;
    // }
    
    const userConfirmed = confirm('Are you sure you want to log out?');
    if (userConfirmed) {
      // User clicked "OK"
      alert('Logging you out...');
      sessionStorage.removeItem('token'); // Clear the token from session storage
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('role');
      window.location.href = '/login.html'; // Redirect to the login page
    } else {
      // User clicked "Cancel"
      alert('Logout cancelled.');
    }
  }

  // ---------------------------------------------- QUIZ RESULTS ----------------------------------------------


  async function fetchUserQuizResults() {
    try {
      const response = await fetchWithAuth('/account/quizResult'); // ------------------------------------------------- headers in jwtutility.js
      if (!response) return; // *************** changes for jwt
      // if (!response.ok) throw new Error('Failed to fetch quiz results');

      const quizResults = await response.json();
      // console.log('Fetched quiz results:', quizResults); // Debugging log

      // group by title since title is unique too
      quizResults.forEach(result => {
          result.QuizID = result.QuizTitle; // Assuming QuizTitle as QuizID for grouping
      });

      // Fetching the attempt count
      const attemptCountResponse = await fetchWithAuth('/account/getAttemptCountByQuizId'); // ------------------------------------------------- headers in jwtutility.js
      if (!attemptCountResponse) return; // *************** changes for jwt
 
      // sorting quiz results by AttemptDate in descending order
      quizResults.sort((a, b) => new Date(b.AttemptDate) - new Date(a.AttemptDate));

      // Group quiz results by QuizID
      const groupedQuizResults = quizResults.reduce((acc, result) => {
          // console.log('Processing result:', result); // Debugging log
          const quizId = result.QuizID || result.quiz_id;
          if (!acc[quizId]) {
              acc[quizId] = [];
          }
          acc[quizId].push(result);
          return acc;
      }, {});

      // console.log('Grouped quiz results:', groupedQuizResults); // Debugging log

      const quizResultsContainer = document.querySelector('.quiz-results');
      const noQuizResultsMessage = document.querySelector('.no-quiz-results-message');

      quizResultsContainer.innerHTML = ''; // Clear previous results

      if (quizResults.length === 0) {
          noQuizResultsMessage.style.display = 'block';  // Show message if no quiz results
      } else {
          noQuizResultsMessage.style.display = 'none';  // Hide message if there are quiz results
          Object.keys(groupedQuizResults).forEach(quizId => {
              const results = groupedQuizResults[quizId];
              results.forEach((result, index) => {
                  const attemptNumber = index + 1; // Correct attempt number for each quiz ID
                  createQuizResultCard(result, quizResultsContainer, attemptNumber); // Create and display quiz result card
              });
            });
          }
        } catch (error) {
      console.error('Error fetching quiz results:', error); // Log any errors that occur
    }
  }
  
  function createQuizResultCard(result, quizResultsContainer, attemptNumber) {
  // console.log('Creating quiz result card for:', result); // Debugging log
  // console.log('Attempt Number:', attemptNumber); // Debugging log

  const quizResultCard = document.createElement('div');
  quizResultCard.className = 'quiz-result-card'; // Set class for styling
  quizResultCard.setAttribute('data-quiz-id', result.AttemptID); // Set data attribute with quiz attempt ID

  const attemptDateStr = result.AttemptDate;

  // Split the date string into date and time parts
  const [datePart, timePart] = attemptDateStr.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute, second] = timePart.split(':');

  // Reformat the date and time parts
  const formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second.slice(0, 2)}`;

    // Set the inner HTML of the quiz result card
  quizResultCard.innerHTML = `
      <div class="quiz-result-header">
          <span class="quiz-title">${result.QuizTitle}</span>
          <span class="quiz-date">${formattedDate}</span>
      </div>
      <div class="quiz-result-details">
          <p><strong>Attempt number:</strong> ${attemptNumber}</p>
          <p><strong>Score:</strong> ${result.Score}/${result.TotalMarks}</p>
          <p><strong>Total Questions:</strong> ${result.TotalQuestions}</p>
          <p><strong>Time Taken:</strong> ${result.TimeTaken ? result.TimeTaken + ' seconds' : 'N/A'}</p>
          <p><strong>Passed:</strong> ${result.Passed ? 'Yes' : 'No'}</p>
      </div>
  `;
  
  quizResultsContainer.appendChild(quizResultCard); // Append the card to the container
}

// ---------------------- fetch total quizzes taken ----------------------

async function fetchTotalQuizzesTaken() {
  try {
      const response = await fetchWithAuth('/account/getAllAttemptCount'); // ------------------------------------------------- headers in jwtutility.js
      if (!response) return; // *************** changes for jwt
      // if (!response.ok) throw new Error('Failed to fetch total quizzes taken');

      const dataWrapper = await response.json();
      console.log('Fetched total quizzes data wrapper:', dataWrapper); // Debugging log

      const totalQuizzes = dataWrapper?.AttemptCount; // extract the AttemptCount directly
      // console.log('Total quizzes data:', totalQuizzes); // Debugging log

      if (typeof totalQuizzes !== 'number') {
          throw new Error('Total quizzes data is not a number');  // Throw error if data is not a number
      }

      document.getElementById('total-quizzes').textContent = totalQuizzes;  // Update the total quizzes count
  } catch (error) {
      console.error('Error fetching total quizzes taken:', error); // Log any errors that occur
  }
}
// Fetch user quiz results on page load
document.addEventListener('DOMContentLoaded', fetchUserQuizResults);
