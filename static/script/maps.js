$(document).ready(function() {
    let allEmployees = [];
    let currentMapId = 0;
    const modal = $('#access-modal');
    
    // Предзагрузка всех сотрудников при загрузке страницы
    $.get('/get_employees', function(data) {
        allEmployees = data.employees;
    }).fail(function() {
        console.error('Ошибка загрузки списка сотрудников');
    });

    // Открытие модального окна
    $(document).on('click', '.manage-access', function(e) {
        e.preventDefault();
        currentMapId = $(this).data('map-id');
        
        // Загружаем текущие доступы для этой карты
        $.get('/get_map_access/' + currentMapId, function(accessData) {
            renderEmployeesList(accessData.user_ids);
            modal.show();
        }).fail(function() {
            alert('Ошибка загрузки данных доступа');
        });
    });

    // Функция отрисовки списка сотрудников
    function renderEmployeesList(accessUserIds) {
        let html = '';
        
        if (allEmployees.length > 0) {
            allEmployees.forEach(employee => {
                const hasAccess = accessUserIds.includes(employee.id);
                html += `
                <div class="employee-item">
                    <input type="checkbox" 
                           id="emp-${employee.id}" 
                           value="${employee.id}"
                           ${hasAccess ? 'checked' : ''}>
                    <label for="emp-${employee.id}">
                        <span class="emp-name">${employee.name}</span>
                        <span class="emp-position">${employee.position}</span>
                    </label>
                </div>
                `;
            });
        } else {
            html = '<p>Нет сотрудников в базе данных</p>';
        }
        
        $('#employees-list').html(html);
    }

    // Закрытие модального окна
    $('.close').on('click', function() {
        modal.hide();
    });

    $(window).on('click', function(event) {
        if (event.target == modal[0]) {
            modal.hide();
        }
    });

    // Сохранение доступа
    $('#save-access').on('click', function() {
        const selectedUsers = [];
        $('#employees-list input:checked').each(function() {
            selectedUsers.push($(this).val());
        });
        
        $.ajax({
            url: '/map_access/' + currentMapId,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({users: selectedUsers}),
            success: function(response) {
                if (response.success) {
                    alert('Доступ успешно обновлен!');
                    modal.hide();
                } else {
                    alert('Ошибка: ' + (response.error || 'Неизвестная ошибка'));
                }
            },
            error: function(xhr) {
                alert('Ошибка сохранения: ' + xhr.responseText);
            }
        });
    });
});
  // Удаление карты
  $(document).on('click', '.delete-map', function(e) {
        e.preventDefault();
        const mapId = $(this).data('map-id');
        if (confirm('Вы уверены, что хотите удалить эту карту?')) {
            $.ajax({
                url: '/delete_map/' + mapId,
                method: 'POST',
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert('Ошибка: ' + (response.error || 'Неизвестная ошибка'));
                    }
                },
                error: function(xhr) {
                    alert('Ошибка при удалении карты: ' + xhr.responseText);
                }
            });
        }
    });