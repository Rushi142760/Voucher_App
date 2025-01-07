// Function to display results in a table
function displayResults(data) {
  const resultsElement = document.getElementById('results');
  console.log('Data present in JS:', data);

  resultsElement.innerHTML = ''; // Clear any previous results

  if (!Array.isArray(data) && data) {
    // When data is a single object
    resultsElement.innerHTML = `
      <tr data-ref-no="${data.billRefNo}">
        <td>${data.billRefNo}</td>
        <td>${data.date}</td>
        <td>${data.totalAmount}</td>
        <td>${data.custName}</td>
        <td class="d-flex justify-content-between">
          <button class="btn btn-info btn-sm mx-2" onclick="viewVoucher('${data.billRefNo}')">View</button>
          <button class="btn btn-success btn-sm mx-2" onclick="printVoucher('${data.billRefNo}')">Print</button>
        </td>
      </tr>`;
  } else if (Array.isArray(data) && data.length > 0) {
    // When data is an array with multiple records
    let rows = '';
    data.forEach(voucher => {
      rows += `
        <tr data-ref-no="${voucher.billRefNo}">
          <td>${voucher.billRefNo}</td>
          <td>${voucher.date}</td>
          <td>${voucher.totalAmount}</td>
          <td>${voucher.custName}</td>
          <td class="d-flex justify-content-between">
            <button class="btn btn-info btn-sm mx-2" onclick="viewVoucher('${voucher.billRefNo}')">View</button>
            <button class="btn btn-success btn-sm mx-2" onclick="printVoucher('${voucher.billRefNo}')">Print</button>
          </td>
        </tr>`;
    });
    resultsElement.innerHTML = rows;
  } else {
    // Handle the case when no records are found
    resultsElement.innerHTML = `<tr><td colspan="5">No records found</td></tr>`;
  }
}

// Function to display the print preview from backend
function printVoucher(refNo) {
  // Fetch the voucher details first
  fetch(`http://localhost:8082/api/vouchers/${refNo}`)
    .then(response => response.json())
    .then(voucher => {
      // Send the fetched voucher details directly as JSON to the backend to generate a PDF preview
      fetch('http://localhost:8082/api/vouchers/print_pre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(voucher)  // Send the entire voucher object as JSON
      })
        .then(response => response.blob())  // Handle PDF blob
        .then(blob => {
          // Create a URL for the blob (PDF data)
          const pdfUrl = URL.createObjectURL(blob);

          // Open the PDF in a new window or tab for print preview
          const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');

          if (!printWindow) {
            alert('Please allow popups for this website to preview the voucher.');
            return;
          }

          // Focus the print preview window
          printWindow.focus();
        })
        .catch(error => {
          console.error('Error fetching voucher preview:', error);
          alert('Failed to fetch voucher preview.');
        });
    })
    .catch(error => {
      console.error('Error fetching voucher:', error);
      alert('Failed to fetch voucher details for preview');
    });
}


// Function to handle View button
function viewVoucher(refNo) {
  window.open(`view-voucher.html?refNo=${refNo}`, '_blank', 'width=1000,height=600');
  console.log('view-voucher from list button "View"')
}

// Function to handle Edit button
function editVoucher(refNo) {
  alert(`Edit voucher with REF NO: ${refNo}`);
  // You can implement redirection to an edit page or show a form in a modal.
}

// Function to handle Delete button
function deleteVoucher(refNo) {
  alert(`Delete voucher with REF NO: ${refNo}`);
  // Implement deletion logic here.
}

// Function to search by REF No
function searchByRefNo() {
  const refNo = document.getElementById('refNoInput').value;
  if (!refNo) {
    alert('Please enter a REF NO.');
    return;
  }

  fetch(`http://localhost:8082/api/vouchers/${refNo}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayResults(data);
    })
    .catch(error => {
      console.error('Error fetching voucher by REF NO:', error);
      alert('Failed to fetch voucher. Please check the REF NO.');
    });
}

// Function to search by Date
function searchByDate() {
  const date = document.getElementById('dateInput').value;
  if (!date) {
    alert('Please select a date.');
    return;
  }

  fetch(`http://localhost:8082/api/vouchers/date/${date}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayResults(data);
    })
    .catch(error => {
      console.error('Error fetching vouchers by date:', error);
      alert('Failed to fetch vouchers. Please check the date.');
    });
}

// code from view-voucher window
window.addEventListener('message', (event) => {
  const { action, refNo } = event.data;

  if (action === 'update') {
    // Fetch the updated voucher details and refresh the row
    fetch(`http://localhost:8082/api/vouchers/${refNo}`)
      .then(response => response.json())
      .then(updatedVoucher => {
        // Update the specific row in the table
        const row = document.querySelector(`tr[data-ref-no="${refNo}"]`);
        if (row) {
          row.innerHTML = `
            <td>${updatedVoucher.billRefNo}</td>
            <td>${updatedVoucher.date}</td>
            <td>${updatedVoucher.totalAmount}</td>
            <td>${updatedVoucher.custName}</td>
            <td class="d-flex justify-content-between">
              <button class="btn btn-info btn-sm mx-2" onclick="viewVoucher('${updatedVoucher.billRefNo}')">View</button>
              <button class="btn btn-success btn-sm mx-2" onclick="printVoucher('${updatedVoucher.billRefNo}')">Print</button>
            </td>
          `;
        }
      })
      .catch(error => {
        console.error('Error updating voucher in list:', error);
      });
  } else if (action === 'delete') {
    // Remove the row from the table
    const row = document.querySelector(`tr[data-ref-no="${refNo}"]`);
    if (row) {
      row.remove();
    }
  }
});
