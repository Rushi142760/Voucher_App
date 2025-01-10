console.log('create-voucher.js is running')

function showLoader() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('content').style.display = 'none';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

//checking backend code is running
function checkBackendStatus() {

    showLoader();  // Show loader when checking backend status

    fetch('http://localhost:8082/api/vouchers/health')
        .then(response => {
            console.log('Backend is ready:', response.data);

            hideLoader();  // Hide loader when backend is ready

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
                closeButton.addEventListener('click', function () {
                    document.body.removeChild(overlay); // Remove the overlay when the button is clicked
                });
                dialogBox.appendChild(closeButton);

                // Append the dialog box to the overlay
                overlay.appendChild(dialogBox);

                // Append the overlay to the body of the document
                document.body.appendChild(overlay);
            }

            // Fetch jewelry names from the database
            async function fetchJewelryNames() {
                const response = await fetch('http://localhost:8082/api/vouchers/jewellery');
                return response.json();
            }

            // Populate datalist with jewelry names
            async function populateJewelryDatalist(datalistElement) {
                const jewelryNames = await fetchJewelryNames();
                jewelryNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    datalistElement.appendChild(option);
                });
            }

            // Add row functionality
            document.getElementById('addRow').addEventListener('click', async function () {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
        <td>
            <input type="text" class="form-control jewelryInput" name="jewelryName[]" list="jewelryOptions" placeholder="Enter or Select">
            <datalist id="jewelryOptions"></datalist>
        </td>
        <td><input type="number" class="form-control" name="grossWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="netWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="fineWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="rate[]"></td>
        <td><input type="number" class="form-control" name="amount[]" readonly></td>
        <td><button type="button" class="btn btn-danger removeRow">Remove</button></td>
    `;

                // Append new row to the table
                const tableBody = document.querySelector('#voucherDetailsTable tbody');
                tableBody.appendChild(newRow);

                // Populate the datalist in the newly added row
                const datalist = newRow.querySelector('#jewelryOptions');
                await populateJewelryDatalist(datalist);

                // Add event listener to remove row
                newRow.querySelector('.removeRow').addEventListener('click', function () {
                    newRow.remove();
                    updateTotals();
                });

                updateTotals();
            });

            // Populate datalist for existing rows
            document.querySelectorAll('datalist#jewelryOptions').forEach(async (datalist) => {
                await populateJewelryDatalist(datalist);
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
                document.getElementById('totalAmountT').textContent = totalAmountT
            }

            // Save voucher
            document.getElementById('voucherForm').addEventListener('submit', function (event) {
                event.preventDefault();

                updateTotals(); // Ensure totals are updated before submission

                const enteredTotalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
                const calculatedTotalAmount = parseFloat(document.getElementById('totalAmountT').textContent) || 0;

                // Validate total amount
                const selectedBillType = document.querySelector('input[name="billType"]:checked')?.value;

                if (selectedBillType === 'By Rate') {
                    if (enteredTotalAmount !== calculatedTotalAmount) {
                        showCustomDialog(`Total Amount does not match the calculated sum.`);
                        return;
                    }
                }


                const voucherData = {
                    billRefNo: document.getElementById('billRefNo').value || "",
                    date: document.getElementById('date').value || "",
                    totalAmount: enteredTotalAmount || 0,
                    billType: document.querySelector('input[name="billType"]:checked')?.value || "",
                    metalType: document.getElementById('metalType').value || "",
                    custName: document.getElementById('custName').value || "",
                    custPhone: document.getElementById('custPhone').value || "",
                    address: document.getElementById('address').value || "",
                    modeOfPayment: document.getElementById('modeOfPayment').value || "",
                    billRate: isNaN(parseFloat(document.getElementById('billRate').value)) ? 0 : parseFloat(document.getElementById('billRate').value),
                    avgWeight: isNaN(parseFloat(document.getElementById('avgWeight').value)) ? 0 : parseFloat(document.getElementById('avgWeight').value),
                    totalGrossWeight: isNaN(parseFloat(document.getElementById('grossWeightTotal').textContent)) ? 0 : parseFloat(document.getElementById('grossWeightTotal').textContent),
                    totalNetWeight: isNaN(parseFloat(document.getElementById('netWeightTotal').textContent)) ? 0 : parseFloat(document.getElementById('netWeightTotal').textContent),
                    totalFineWeight: isNaN(parseFloat(document.getElementById('fineWeightTotal').textContent)) ? 0 : parseFloat(document.getElementById('fineWeightTotal').textContent),
                    totalAmountT: calculatedTotalAmount || 0,
                    voucherDetails: [],
                };

                console.log(JSON.stringify(voucherData, null, 2));

                const rows = document.querySelectorAll('#voucherDetailsTable tbody tr');
                rows.forEach(function (row) {
                    voucherData.voucherDetails.push({
                        date: document.getElementById('date').value || "",
                        billType: document.querySelector('input[name="billType"]:checked')?.value || "",
                        jewelryName: row.querySelector('input[name="jewelryName[]"]').value || "",
                        grossWeight: isNaN(parseFloat(row.querySelector('input[name="grossWeight[]"]').value)) ? 0 : parseFloat(row.querySelector('input[name="grossWeight[]"]').value),
                        netWeight: isNaN(parseFloat(row.querySelector('input[name="netWeight[]"]').value)) ? 0 : parseFloat(row.querySelector('input[name="netWeight[]"]').value),
                        fineWeight: isNaN(parseFloat(row.querySelector('input[name="fineWeight[]"]').value)) ? 0 : parseFloat(row.querySelector('input[name="fineWeight[]"]').value),
                        rate: isNaN(parseFloat(row.querySelector('input[name="rate[]"]').value)) ? 0 : parseFloat(row.querySelector('input[name="rate[]"]').value),
                        amount: isNaN(parseFloat(row.querySelector('input[name="amount[]"]').value)) ? 0 : parseFloat(row.querySelector('input[name="amount[]"]').value),
                    });
                });

                console.log(JSON.stringify(voucherData, null, 2));



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
                        console.log(`${error}`)
                        console.error('Error:', error.message);
                        showCustomDialog('Failed to create voucher. Please check Bill Ref No. again');
                    });
            });

            //For dynamic Avg Weight
            // Access the required elements by their IDs
            const totalAmountInput = document.getElementById("totalAmount");
            const billRateInput = document.getElementById("billRate");
            const avgWeightInput = document.getElementById("avgWeight");

            // Function to calculate Average Weight
            function calculateAvgWeight() {
                const totalAmount = parseFloat(totalAmountInput.value) || 0; // Get Total Amount as a float
                const billRate = parseFloat(billRateInput.value) || 0;       // Get Bill Rate as a float

                if (billRate > 0) {
                    const avgWeight = totalAmount / billRate;                // Calculate Average Weight
                    avgWeightInput.value = avgWeight;             // Set the value with 2 decimal places
                } else {
                    avgWeightInput.value = "";                               // Clear field if calculation is not valid
                }
            }

            // Attach event listeners for 'input' events
            totalAmountInput.addEventListener("input", calculateAvgWeight);
            billRateInput.addEventListener("input", calculateAvgWeight);

            // Trigger initial calculation in case there are existing values
            calculateAvgWeight();




        }).catch(error => {
            console.error('Backend is not ready:', error);
            setTimeout(checkBackendStatus, 3000);  // Retry after 3 seconds
        });
}

checkBackendStatus();

