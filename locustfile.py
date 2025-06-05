from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)  # Имитация задержки между действиями

    @task
    def load_test(self):
        self.client.get("/")  # Тест главной страницы
        self.client.post("/login", json={"email": "hr@mail.ru", "password": "123456"})