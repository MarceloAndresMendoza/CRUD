// Marcelo Mendoza 2023 - Licencia GNU v3 - https://github.com/MarceloAndresMendoza

function init() {
    loadUserInfo(); // Carga la información general de la tabla anexa
    loadTableData(); // Carga la información de la tabla principal
    fBindInputBoxes(); // Asigna el evento keypress('enter') para añadir un registro a cada cuadro de texto
    fBindID('btYes', 'click', saveTestingData);
    fBindID('btNo', 'click', hideModal);
    fBindID('btDelete', 'click', deleteSavedData);
    fBindID('btDeleteItem', 'click', deleteItem);
    fBindID('btAddItem', 'click', addItem);
    fBindID('btOk', 'click', hideModal);
    fBindID('btToday', 'click', fillDateToday);
    fBindID('btDeselect', 'click', selectNone);
    fBindID('btEditItem', 'click', replaceItem);
    fBindID('btPrint', 'click', print);
    fBindID('needIVA', 'click', calculateAll);
}

function checkIVA() {
    const needsIVA = document.getElementById('needIVA').checked;
    return needsIVA;
}

function fBindID(elementId, event, method) {
    // Atajo para asignar un evento ('click') a un elemento por su ID
    document.getElementById(elementId).addEventListener(event, method);
}

function fBindInputBoxes() {
    // Asigna el evento keypress('enter') para añadir un registro a cada cuadro de texto
    const inputBoxes = document.getElementsByClassName('newItemtextBox');
    for (n = 0; n < inputBoxes.length; n++) {
        inputBoxes[n].addEventListener('keypress', addItemWrapper);
    }
}

const addItemWrapper = function (event) {
    const argument = event.key;
    if (argument === 'Enter') {
        addItem();
    }
}

function loadUserInfo() {
    // Load info data from localstorage
    const infoDataElement = document.getElementsByClassName('infoTextBox');
    for (let n = 0; n < infoDataElement.length; n++) {
        // Iterate in each inputbox
        let savedInfoData = localStorage.getItem(infoDataElement[n].id);
        if (infoDataElement[n].type == 'checkbox') {
            if (savedInfoData == 'true') {
                infoDataElement[n].checked = true;
            }
        } else {
            infoDataElement[n].value = savedInfoData;
        }
        if (infoDataElement[n].type == 'text') {
            // Put a listener to save this value on text change
            infoDataElement[n].addEventListener('keyup', saveUserInfoWrapper);
        } else {
            infoDataElement[n].addEventListener('change', saveUserInfoWrapper);
        }
    }
    // If there is a user name, salute properly
    const savedUserName = document.getElementById('userName').value;
    if (savedUserName) {
        document.getElementById('welcome').innerHTML = `Bienvenido,  ${savedUserName}`
    };
}

function loadTableData() {
    // Populate the main table with localStorage data.
    let savedTableData = localStorage.getItem('tableData');
    const dataTable = document.getElementById('data');
    // console.log(savedTableData);
    if (savedTableData) { // If there is local data, parse it and populate the table. Otherwise, show the splash screen.
        // Parse the saved data
        console.log('Found data, parsing')
        let parsedData = JSON.parse(savedTableData);
        console.log('- Found ' + Object.keys(parsedData).length + ' items')
        for (let n = 1; n < (Object.keys(parsedData).length) + 1; n++) {
            console.log('- Reading data # ' + n)
            let row = document.createElement('tr');
            row.id = 'element-' + n;
            row.classList.add('selectable');
            Object.keys(parsedData[n]).forEach((key, index) => {
                let cell = document.createElement('td');
                let cellText = document.createTextNode(parsedData[n][key]);
                // Add custom classes from the input's special data-classes, if any.
                const getCurrentInputEquivalent = document.getElementsByClassName('newItemtextBox');
                const customClasses = getCurrentInputEquivalent[index].getAttribute('data-classes');
                // This will replace any class set before:
                if (customClasses) { cell.className = customClasses; };
                // Set 'readonly' if applicable
                if (cellText.nodeValue === 'readonly') {
                    cell.innerHTML = '';
                    cell.classList.add('readonly');
                } else {
                    cell.appendChild(cellText);
                }
                cell.id = key;
                row.appendChild(cell);
            });
            dataTable.appendChild(row);
            // Make it selectable
            document.getElementById('element-' + n).addEventListener('click', selectWrapperFn);
            calculateAll()
        }
        reenumerateItems();
    } else {
        // No data saved, show the splash screen
        console.log('No data found, creating placeholder text')
        addPlaceholderRow();
        document.getElementById('modalForm').classList.remove('hidden');
    }
}

function addPlaceholderRow() {
    // If there is no data on the table, put a placeholder text
    const dataTable = document.getElementById('data');
    let newRow = document.createElement('tr');
    newRow.id = 'placeholder-text';
    newRow.className = 'placeholder-text';
    let newCell = document.createElement('td');
    newCell.colSpan = 4;
    let cellText = document.createTextNode('Sin elementos. Rellene los campos y haga click en "Agregar"');
    newCell.appendChild(cellText);
    newRow.appendChild(newCell);
    dataTable.appendChild(newRow);
}

const selectWrapperFn = function (event) {
    // Using a wrapper because if i hardcode the argument on runtime at object creation,
    // i will reference a non existent element when deleting and reenumerating elements.
    // This function instead will look for the ID after reenumerating.
    const argument = event.currentTarget.id;
    selectElement(argument);
}

function selectNone() {
    // Clear 'selected' class to any item
    let elements = document.getElementsByClassName('selected');
    if (elements.length > 0) {
        elements[0].classList.remove('selected');
        const getEditBoxes = document.getElementsByClassName('newItemtextBox');
        for (let n = 0; n < getEditBoxes.length; n++) {
            getEditBoxes[n].value = '';
        }
    }
}

function selectElement(element) {
    // Add the class 'selected' to the clicked element
    console.log('Selected item ' + element);
    // First, clear any other selected status
    selectNone();
    // Now, add selected class to the clicked item
    document.getElementById(element).classList.add('selected');
    // Put the values on the input boxes for editing the values
    const getSelectedRow = document.getElementsByClassName('selected');
    const tdElements = getSelectedRow[0].querySelectorAll('td');
    const getEquivalentEditBox = document.getElementsByClassName('newItemtextBox');
    // loop through each td element and add it to the getSelectedValues array
    for (let n = 0; n < tdElements.length; n++) {
        if (!getEquivalentEditBox[0].getAttribute('type') === 'number') {
            const getSelectedValues = tdElements[n].innerText;
            getEquivalentEditBox[n].value = getSelectedValues;
        } else {
            const getSelectedValues = tdElements[n].innerText;
            getEquivalentEditBox[n].value = getSelectedValues.replace(/\./g, "");
        }
    }
}

const saveUserInfoWrapper = function (event) {
    const argument = event.currentTarget.id;
    saveUserInfo(argument)
}

function saveUserInfo(optionalElementID) {
    // Save the user info table
    if (optionalElementID === undefined) {
        // Save all userinfo fields
        const userInfoElements = document.getElementsByClassName('infoTextBox');
        for (n = 0; n < userInfoElements.length; n++) {
            var newValue = undefined;
            if (userInfoElements[n].classList.contains('readonly')) {
                newValue = 'readonly';
            } else {
                if (userInfoElements[n].type == 'checkbox') {
                    newValue = infoDataElement[n].checked;
                } else {
                    newValue = infoDataElement[n].value;
                }
            }
            localStorage.setItem(userInfoElements[n].id, newValue);
        }
    } else {
        // Save only the specified element on the optional argument
        const userInfoElement = document.getElementById(optionalElementID);
        var newValue = undefined;
        if (userInfoElement.classList.contains('readonly')) {
            newValue = 'readonly';
        } else {
            if (userInfoElement.type == 'checkbox') {
                newValue = userInfoElement.checked;
            } else {
                newValue = userInfoElement.value;
            }
        }
        localStorage.setItem(optionalElementID, newValue);
    }
}

function calculateAll() {
    // Recalculate totals
    const multiplyByQtyElements = document.getElementsByClassName('multiplyByQty');
    const multiplyByValueElements = document.getElementsByClassName('multiplyByValue');
    const multiplyByTotalElements = document.getElementsByClassName('multiplyByTotal');
    const IVAvalue = document.getElementById('IVAvalue');
    const subtotalValue = document.getElementById('subtotal');
    for (n = 0; n < multiplyByTotalElements.length; n++) {
        multiplyByTotalElements[n].innerText = formatNumber(
            Number(multiplyByQtyElements[n].innerText) * Number(multiplyByValueElements[n].innerText.replace(/\./g, ""))
        )
    }
    const calcTotal = document.getElementById('total');
    const getSubTotals = document.getElementsByClassName('multiplyByTotal');
    var valSum = 0;
    for (n = 0; n < getSubTotals.length; n++) {
        valSum += Number(getSubTotals[n].innerText.replace(/\./g, ""));
    }
    let valIVA = valSum * 0.19;
    if (checkIVA()) {
        IVAvalue.innerText = "$ " + formatNumber(valIVA );
        subtotalValue.innerText = "$ " + formatNumber(valSum);
        calcTotal.innerText = formatNumber(valSum + valIVA);
    } else {
        IVAvalue.innerText = "-"
        subtotalValue.innerText = "-";
        calcTotal.innerText = formatNumber(valSum);
    }

}

function saveTestingData() {
    // Add example data
    let data = {
        1: {
            field1: "25",
            field2: "Mesas",
            field3: "45.000",
            field4: "readonly"
        },
        2: {
            field1: "26",
            field2: "Sillas",
            field3: "15.000",
            field4: "readonly"
        },
        3: {
            field1: "1",
            field2: "Mesón del profesor",
            field3: "170.000",
            field4: "readonly"
        },
        4: {
            field1: "1",
            field2: "Silla del profesor",
            field3: "25.000",
            field4: "readonly"
        },
        5: {
            field1: "1",
            field2: "Pizarrón para plumon",
            field3: "220.000",
            field4: "readonly"
        },
        6: {
            field1: "1",
            field2: "Reloj de pared, análogo",
            field3: "12.000",
            field4: "readonly"
        },
        7: {
            field1: "1",
            field2: "Libro de curso",
            field3: "24.600",
            field4: "readonly"
        },
        8: {
            field1: "2",
            field2: "Muebles archivadores",
            field3: "78.000",
            field4: "readonly"
        }
    }
    let jsonData = JSON.stringify(data);
    localStorage.setItem('tableData', jsonData);
    localStorage.setItem('userName', 'Juan Casas Flores');
    localStorage.setItem('userBusiness', 'Muebles Flores Ltda');
    localStorage.setItem('userProjectName', 'Habilitación Sala Clases');
    localStorage.setItem('userProjectCode', 'FL-2033');
    localStorage.setItem('projectDestName', 'Sr. José Cuevas');
    localStorage.setItem('projectDestBusiness', 'Escuela Los Álamos');
    localStorage.setItem('projectStartDate', '2023-05-24');
    localStorage.setItem('projectEndDate', '2023-05-30');
    document.getElementById('btYes').classList.add('hidden');
    document.getElementById('btNo').classList.add('hidden');
    document.getElementById('status-title').innerText = "";
    document.getElementById('status-text').innerText = "Rellenando datos de prueba...";
    const reloadNow = setTimeout(reloadPage, 300);
    return ('Saved testing data on localstorage');
}

function addItem() {
    // Add a new table item
    var cells = document.getElementsByClassName('newItemtextBox');
    var proceed = true;
    for (let n = 0; n < cells.length; n++) {
        // Checking if there are blank editable text boxes, so ask the user to filling them before add an item
        if (!cells[n].classList.contains('readonlyTextBox')) {
            if (cells[n].value === '') {
                proceed = false;
                fAlert('Por favor, ingrese todos los campos', 'warning');
            }
        }
    }
    if (proceed) { // There are no blank text boxes, so proceed with adding new data
        let row = document.createElement('tr');
        // Get how many items are on the table
        let items = document.getElementsByClassName('selectable');
        let itemCounter = items.length + 1; // Adding one for the new item
        // Checks if there is a placeholder and take it out
        if (itemCounter === 1) {
            placeHolderRow = document.getElementById('placeholder-text');
            if (placeHolderRow) { placeHolderRow.remove(); }
        }
        // Add a new item
        row.id = 'element-' + itemCounter;
        row.classList.add('selectable');
        for (let n = 0; n < cells.length; n++) {
            let cell = document.createElement('td');
            var cellText = "";
            // Add custom classes from the input's special data-classes, if any.
            const getCurrentInputEquivalent = document.getElementsByClassName('newItemtextBox');
            const customClasses = getCurrentInputEquivalent[n].getAttribute('data-classes');
            // This will replace any class set before:
            if (customClasses) { cell.className = customClasses; };
            console.log(customClasses);
            if (cells[n].classList.contains('readonlyTextBox')) {
                cell.innerHTML = '';
                cell.classList.add('readonly');
            } else {
                // Check if the input field is a number type
                let newText;
                if (cells[n].getAttribute('type') === 'number') {
                    newText = formatNumber(cells[n].value);
                } else {
                    newText = cells[n].value;
                }
                cellText = document.createTextNode(newText);
                cell.appendChild(cellText);
            }
            cells[n].value = "";
            cell.id = cells[n].id;
            row.appendChild(cell);
        };
        const dataTable = document.getElementById('data');
        dataTable.appendChild(row);
        // Make it selectable
        document.getElementById('element-' + itemCounter).addEventListener('click', selectWrapperFn);
        saveItems();
        fAlert('Registro agregado', 'info');
        calculateAll();
        selectNone();
        setFocusFirstInput();
    }
}

function replaceItem() {
    // Modify current selected item with the data written on the editing text boxes
    var selectedItem = document.getElementsByClassName('selected');
    if (selectedItem.length > 0) {
        var cells = document.getElementsByClassName('newItemtextBox');
        var proceed = true;
        for (let n = 0; n < cells.length; n++) {
            if (!cells[n].classList.contains('readonlyTextBox')) {
                if (cells[n].value === '') {
                    proceed = false;
                    fAlert('Por favor, rellene todos los campos', 'warning');
                }
            }
        }
        if (proceed) {
            let row = document.createElement('tr');
            // Get how many items are on the table
            let items = document.getElementsByClassName('selectable');
            let itemCounter = items.length + 1; // Adding one for the new item
            // Add a new item
            row.id = 'element-' + itemCounter;
            row.classList.add('selectable');
            for (let n = 0; n < cells.length; n++) {
                let cell = document.createElement('td');
                var cellText = "";
                // Add custom classes from the input's special data-classes, if any.
                const getCurrentInputEquivalent = document.getElementsByClassName('newItemtextBox');
                const customClasses = getCurrentInputEquivalent[n].getAttribute('data-classes');
                // This will replace any class set before:
                if (customClasses) { cell.className = customClasses; };
                if (cells[n].classList.contains('readonlyTextBox')) {
                    cell.innerHTML = '';
                    cell.classList.add('readonly');
                } else {
                    // Check if the input field is a number type
                    let newText;
                    if (cells[n].getAttribute('type') === 'number') {
                        newText = formatNumber(cells[n].value);
                    } else {
                        newText = cells[n].value;
                    }
                    cellText = document.createTextNode(newText);
                    cell.appendChild(cellText);
                }
                cells[n].value = "";
                cell.id = cells[n].id;
                row.appendChild(cell);
            };
            // Now find the current selected element and replace it
            selectedItem[0].replaceWith(row);
            // const dataTable = document.getElementById('data');
            // dataTable.appendChild(row);
            // Make it selectable
            document.getElementById('element-' + itemCounter).addEventListener('click', selectWrapperFn);
            saveItems();
            fAlert('Registro modificado', 'info');
            calculateAll();
            reenumerateItems();
            setFocusFirstInput();
        }
    } else {
        fAlert('Debe seleccionar antes un elemento para editar', 'warning');
    }
}

function setFocusFirstInput() {
    // Bring the cursor to the first editing text box for convenience
    const inputBoxes = document.getElementsByClassName('newItemtextBox');
    inputBoxes[0].focus();
}

function formatNumber(number) {
    // Add thousands separators
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function deleteItem() {
    // Deletes an item
    // Search for a selected item:
    let selectedItem = document.getElementsByClassName('selected');
    if (selectedItem.length > 0) {
        selectedItem[0].remove();
        fAlert('Registro eliminado', 'info');
        console.log('Deleted selected item');
        reenumerateItems();
        saveItems();
        calculateAll();
    } else {
        // modalAlert('Advertencia', 'Seleccione antes un item para eliminar');
        fAlert('Seleccione antes un registro para eliminar', 'warning');
    }
}

function saveItems() {
    // Save all the data on the main table to localStorage
    let data = {};
    const elements = document.getElementsByClassName('selectable');
    let n = 0;
    for (const currentElement of elements) {
        n++;
        let itemData = document.querySelectorAll('tr#' + currentElement.id + ' td');
        data[n] = {};
        for (const currentItemData of itemData) {
            if (currentItemData.classList.contains('readonly')) {
                data[n][currentItemData.id] = 'readonly';
            } else {
                data[n][currentItemData.id] = currentItemData.innerText;
            }
        }
        // console.log(data[n]);
    };
    // console.log(data);
    console.log('Data saved (' + n + ' elements)');
    let jsonData = JSON.stringify(data);
    localStorage.setItem('tableData', jsonData);
}

function reenumerateItems() {
    // Reassing IDs to every table item to ensures unique item's IDs.
    const elements = document.getElementsByClassName('selectable');
    let counter = 1;
    if (elements.length > 0) {
        for (counter; counter < (elements.length + 1); counter++) {
            elements[counter - 1].id = 'element-' + counter;
        }
        console.log('Elements reenumerated (' + counter + ' total)');
    } else {
        addPlaceholderRow();
        console.log('No elements found');
    }
}

function hideModal() {
    // Hides modal splash screen
    document.getElementById('btOk').classList.add('hidden');
    document.getElementById('modalForm').classList.add('hidden');
}

function reloadPage() {
    // Self explanatory
    location.reload();
}

function deleteSavedData() {
    // Clear all localStorage data
    localStorage.clear();
    document.getElementById('btYes').classList.add('hidden');
    document.getElementById('btNo').classList.add('hidden');
    document.getElementById('status-title').innerText = "Eliminando datos";
    document.getElementById('status-text').innerText = "Espere...";
    document.getElementById('modalForm').classList.remove('hidden');
    const reloadNow = setTimeout(reloadPage, 200);
    return ('All data deleted');
}

function modalAlert(title, message) {
    // Shows a full screen modal alert
    document.getElementById('btYes').classList.add('hidden');
    document.getElementById('btNo').classList.add('hidden');
    document.getElementById('btOk').classList.remove('hidden');
    document.getElementById('status-title').innerText = title;
    document.getElementById('status-text').innerText = message;
    document.getElementById('modalForm').classList.remove('hidden');
}

function fillDateToday() {
    // Change the start date with today's date
    document.getElementById('projectStartDate').value = getToday();
    saveUserInfo('projectStartDate');
}

function getToday() {
    // What days is today?
    const date = new Date();
    const year = (date.getFullYear().toString());
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Why 0 to 11, javascript?... why?....
    const day = String(date.getDate()).padStart(2, '0');
    const formatDate = `${year}-${month}-${day}`;
    return formatDate;
}

function fAlert(message, type) {
    // Creates an unobtrusive small alert box for a few seconds, then destroys it without mercy
    const newAlert = document.createElement('div');
    newAlert.classList.add('alert-box');
    const newText = document.createElement('p');
    switch (type) {
        case 'info':
            newText.classList.add('alert-box-info');
            break;
        case 'warning':
            newText.classList.add('alert-box-warning');
            break;
        default:
            newText.classList.add('alert-box-normal');
    }
    newAlert.classList.add('alert-box-hidden');
    newText.innerHTML = message;
    newAlert.appendChild(newText);
    const date = new Date();
    const ms = date.getMilliseconds().toString();
    const alertID = 'alert' + ms;
    newAlert.id = alertID;
    document.getElementById('alert-area').appendChild(newAlert);
    const createdAlert = document.getElementById(alertID);
    setTimeout(function () { createdAlert.classList.remove('alert-box-hidden'); 0 });
    setTimeout(function () { createdAlert.classList.add('alert-box-hidden'); }, 3000);
    setTimeout(function () { createdAlert.remove(); }, 4000);
}

function print() {
    // Creates a new window with its own format for printing the data
    selectNone();
    var divContents = `
    <h1 class="print-heading"><u>Presupuesto</u></h1>
    <h2 class="print-subheading">${document.getElementById('userBusiness').value} - ${document.getElementById('userID').value} </h2>
    <h4 class="print-subheading">${document.getElementById('userName').value} </h4>
    <h4 class="print-subheading">${document.getElementById('projectStartDate').value} </h4>
    <div class="print-space"></div>
    <hr class="print-hr">
    <div class="flex-row">
        <div class="flex-col">
            <h4 class="print-subheading">A nombre de: ${document.getElementById('userProjectName').value} </h4>
            <h4 class="print-subheading">Empresa: ${document.getElementById('projectDestBusiness').value} </h4>
            <h4 class="print-subheading">RUT: ${document.getElementById('businessID').value} </h4>
        </div>
        <div class="flex-col">
            <h4 class="print-subheading">Nombre del proyecto: ${document.getElementById('userProjectName').value} </h4>
            <h4 class="print-subheading">Código: ${document.getElementById('userProjectCode').value} </h4>
        </div>
    </div>
    <div class="print-space"></div>
    <h2>Estimado/a ${document.getElementById('projectDestName').value},</h2>
    <p class="print-text">A continuación, se detalla el presupuesto para el proyecto <strong>${document.getElementById('userProjectName').value}</strong>, vigente desde el ${document.getElementById('projectStartDate').value} hasta el ${document.getElementById('projectEndDate').value}.</p>
    <div class="print-space"></div>
    <table class="print-table">
        <tbody id="tableContentsContainer">
            <tr>
                <th>Cantidad</th>
                <th>Item</th>
                <th>Precio unitario</th>
                <th>Precio total</th>
            </tr>
        </tbody>
    </table>
    <table id="IVAtablecontainer" class="print-table"></table>
    <h3 class="right-align">Total: $ ${document.getElementById('total').innerText}</h3>
    <div class="print-space"></div>
    <p class="print-text">Agradecemos comunicarse con nosotros para aceptar lo propuesto antes de la fecha de vigencia.</p>
    <p class="print-text">Atentamente, </p>
    <div class="print-space-big"></div>
    <hr class="print-hr">
    <h3>${document.getElementById('userName').value}, ${document.getElementById('userBusiness').value}.</h3>
    `;
    var printWindow = window.open('', '', 'height=900,width=800');
    printWindow.document.write('<html><head><link rel="preload" href="style.css" as="style"><link rel="stylesheet" href="assets/styles/style.css"><title>Print Contents</title>');
    printWindow.document.write('</head><body class="print-body">');
    printWindow.document.write(divContents);
    printWindow.document.write('</body></html>');
    // Fill the table with the data on the main table
    const tableContents = document.getElementsByClassName('selectable');
    for (var n = 0; n < tableContents.length; n++) {
        printWindow.document.getElementById('tableContentsContainer').appendChild(tableContents[n].cloneNode(true));
    }
    if (checkIVA()) {
        const tableIVA = document.getElementById('IVA').cloneNode(true);
        printWindow.document.getElementById('IVAtablecontainer').appendChild(tableIVA);
    }
    setTimeout(function () { printWindow.document.close();; }, 500);
    setTimeout(function () { printWindow.print(); }, 1000);
}

init();