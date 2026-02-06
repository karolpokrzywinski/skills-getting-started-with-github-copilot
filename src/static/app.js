document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: show a temporary message
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Unregister a participant from an activity
  async function unregisterParticipant(activityName, email, btn) {
    try {
      btn.disabled = true;
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await resp.json();
      if (resp.ok) {
        showMessage(result.message, "success");
        // Refresh activities list to reflect change
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister", "error");
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      showMessage("Failed to unregister. Please try again.", "error");
    } finally {
      btn.disabled = false;
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants header
        const participantsHeader = document.createElement("div");
        participantsHeader.className = "participants-header";
        participantsHeader.textContent = "Participants";

        // Participants list
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delete-btn";
            btn.title = "Unregister participant";
            btn.textContent = "×";

            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              unregisterParticipant(name, p, btn);
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-item empty";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        }

        activityCard.appendChild(participantsHeader);
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        // Refresh activities to show the newly registered participant
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
      
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
