let alertCounter = 0;

function powAlert({ color = 'default', title = '', text, html = false, position = 'topRight', stacking = true }, duration = 5000) {
    const alertColors = {
        error: 'red',
        info: 'blue',
        success: 'green',
        warn: 'yellow',
        muted: 'gray',
        default: 'white',
        inverse: 'slate'
    };

    const alertClass = `bg-${alertColors[color]}-100 border-l-4 border-${alertColors[color]}-500 text-${alertColors[color]}-700 p-4 shadow-lg`;
    const alertHTML = html ? text : `<p>${text}</p>`;
    const alertId = `alert-${alertCounter++}`;

    const alertElement = document.createElement('div');
    alertElement.className = alertClass;
    alertElement.id = alertId;
    alertElement.innerHTML = `
        <div role="alert" class="relative">
            ${title ? `<p class="font-bold">${title}</p>` : ''}
            ${alertHTML}
            <button class="absolute top-0 right-0 m-2 ml-3 text-gray-600 hover:text-gray-900 focus:outline-none" onclick="closeAlert('${alertId}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(alertElement);

    // Posicionamento
    switch (position) {
        case 'topRight':
            alertElement.style.position = 'absolute';
            alertElement.style.top = '1rem';
            alertElement.style.right = '1rem';
            break;
        case 'topLeft':
            alertElement.style.position = 'absolute';
            alertElement.style.top = '1rem';
            alertElement.style.left = '1rem';
            break;
        case 'bottomRight':
            alertElement.style.position = 'absolute';
            alertElement.style.bottom = '1rem';
            alertElement.style.right = '1rem';
            break;
        case 'bottomLeft':
            alertElement.style.position = 'absolute';
            alertElement.style.bottom = '1rem';
            alertElement.style.left = '1rem';
            break;
    }

    setTimeout(() => {
        closeAlert(alertId);
    }, duration);
}

function closeAlert(id) {
    const alert = document.getElementById(id);
    if (alert) {
        document.body.removeChild(alert);
    }
}