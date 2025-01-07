console.log('create-voucher.js is running')

// Function to create and show the custom dialog box
function showCustomDialog(message) {
    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
  
    // Create the dialog box container
    const dialogBox = document.createElement('div');
    dialogBox.style.backgroundColor = 'white';
    dialogBox.style.padding = '20px';
    dialogBox.style.borderRadius = '5px';
    dialogBox.style.textAlign = 'center';
    dialogBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Create the message text
    const messageText = document.createElement('p');
    messageText.textContent = message;
    dialogBox.appendChild(messageText);
    
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px 15px';
    closeButton.style.backgroundColor = '#007BFF';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', function() {
      document.body.removeChild(overlay); // Remove the overlay when the button is clicked
    });
    dialogBox.appendChild(closeButton);
    
    // Append the dialog box to the overlay
    overlay.appendChild(dialogBox);
    
    // Append the overlay to the body of the document
    document.body.appendChild(overlay);
  }
  
  // Example usage
 // showCustomDialog("This is a custom dialog box!");
  

// Add row functionality
document.getElementById('addRow').addEventListener('click', function () {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" class="form-control" name="jewelryName[]"></td>
        <td><input type="number" class="form-control" name="grossWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="netWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="fineWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="rate[]"></td>
        <td><input type="number" class="form-control" name="amount[]" readonly></td>
        <td><button type="button" class="btn btn-danger removeRow">Remove</button></td>
    `;
    document.querySelector('#voucherDetailsTable tbody').appendChild(newRow);
    updateTotals();
});

// Update totals when input changes
document.querySelector('#voucherDetailsTable').addEventListener('input', function (e) {
    if (e.target.matches('input[name="grossWeight[]"], input[name="netWeight[]"], input[name="fineWeight[]"], input[name="rate[]"]')) {
        const row = e.target.closest('tr');
        const fineWeight = parseFloat(row.querySelector('input[name="fineWeight[]"]').value) || 0;
        const rate = parseFloat(row.querySelector('input[name="rate[]"]').value) || 0;

        const amount = fineWeight * rate;
        row.querySelector('input[name="amount[]"]').value = amount.toFixed(2);
        updateTotals();
    }
});

// Remove row functionality
document.querySelector('#voucherDetailsTable').addEventListener('click', function (e) {
    if (e.target.classList.contains('removeRow')) {
        e.target.closest('tr').remove();
        updateTotals();
    }
});

// Function to update totals
function updateTotals() {
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalFineWeight = 0;
    let totalAmountT = 0;

    const rows = document.querySelectorAll('#voucherDetailsTable tbody tr');
    rows.forEach(function (row) {
        const grossWeight = parseFloat(row.querySelector('input[name="grossWeight[]"]').value) || 0;
        const netWeight = parseFloat(row.querySelector('input[name="netWeight[]"]').value) || 0;
        const fineWeight = parseFloat(row.querySelector('input[name="fineWeight[]"]').value) || 0;
        const amount = parseFloat(row.querySelector('input[name="amount[]"]').value) || 0;

        totalGrossWeight += grossWeight;
        totalNetWeight += netWeight;
        totalFineWeight += fineWeight;
        totalAmountT += amount;
    });

    document.getElementById('grossWeightTotal').textContent = totalGrossWeight.toFixed(2);
    document.getElementById('netWeightTotal').textContent = totalNetWeight.toFixed(2);
    document.getElementById('fineWeightTotal').textContent = totalFineWeight.toFixed(2);
    document.getElementById('totalAmountT').textContent = totalAmountT.toFixed(2);
}

// Save voucher
document.getElementById('voucherForm').addEventListener('submit', function (event) {
    event.preventDefault();

    updateTotals(); // Ensure totals are updated before submission

    const enteredTotalAmount = parseFloat(document.getElementById('totalAmount').value);
    const calculatedTotalAmount = parseFloat(document.getElementById('totalAmountT').textContent);

    //Validate total amount
    if (Math.abs(enteredTotalAmount - calculatedTotalAmount) > 0.01) {
        showCustomDialog(`Total Amount does not match the calculated sum.`);
        return;
    }

    const voucherData = {
        billRefNo: document.getElementById('billRefNo').value,
        date: document.getElementById('date').value,
        totalAmount: enteredTotalAmount,
        billType: document.querySelector('input[name="billType"]:checked').value,
        metalType: document.getElementById('metalType').value,
        custName: document.getElementById('custName').value,
        custPhone: document.getElementById('custPhone').value,
        address: document.getElementById('address').value,
        modeOfPayment: document.getElementById('modeOfPayment').value,
        billRate: parseFloat(document.getElementById('billRate').value),
        avgWeight: parseFloat(document.getElementById('avgWeight').value),
        totalGrossWeight: parseFloat(document.getElementById('grossWeightTotal').textContent),
        totalNetWeight: parseFloat(document.getElementById('netWeightTotal').textContent),
        totalFineWeight: parseFloat(document.getElementById('fineWeightTotal').textContent),
        totalAmountT: calculatedTotalAmount,
        voucherDetails: [],
    };

    const rows = document.querySelectorAll('#voucherDetailsTable tbody tr');
    rows.forEach(function (row) {
        voucherData.voucherDetails.push({
            date: document.getElementById('date').value,
            billType: document.querySelector('input[name="billType"]:checked').value,
            jewelryName: row.querySelector('input[name="jewelryName[]"]').value,
            grossWeight: parseFloat(row.querySelector('input[name="grossWeight[]"]').value),
            netWeight: parseFloat(row.querySelector('input[name="netWeight[]"]').value),
            fineWeight: parseFloat(row.querySelector('input[name="fineWeight[]"]').value),
            rate: parseFloat(row.querySelector('input[name="rate[]"]').value),
            amount: parseFloat(row.querySelector('input[name="amount[]"]').value),
        });
    });


    fetch('http://localhost:8082/api/vouchers/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
    })
        .then(response => response.json())
        .then(data => {
        //    alert('Voucher created successfully');
            showCustomDialog("Voucher created successfully");
        
            document.getElementById('voucherForm').reset();
            document.querySelector('#voucherDetailsTable tbody').innerHTML = `
                <td><input type="text" class="form-control" name="jewelryName[]"></td>
                <td><input type="number" class="form-control" name="grossWeight[]" step="0.1"></td>
                <td><input type="number" class="form-control" name="netWeight[]" step="0.1"></td>
                <td><input type="number" class="form-control" name="fineWeight[]" step="0.1"></td>
                <td><input type="number" class="form-control" name="rate[]"></td>
                <td><input type="number" class="form-control" name="amount[]" readonly></td>
                <td><button type="button" class="btn btn-danger removeRow">Remove</button></td>
            `;
            updateTotals();
        })
        .catch(error => {
            console.error('Error:', error);
            showCustomDialog('Failed to create voucher. Please check Bill Ref No. again');
        });
});


    