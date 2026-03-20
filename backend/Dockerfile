# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Tối ưu hóa việc tải thư viện Maven (sẽ lấy từ cache nếu pom.xml không đổi)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn và tiến hành build file JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage (Chỉ chạy ứng dụng, làm nhẹ file Docker image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Lấy file jar đã build bên bước 1 sang đây
COPY --from=build /app/target/*.jar app.jar

# Biến môi trường cổng mạng (Render tự gán hoặc mặc định là 8080)
EXPOSE 8080

# Chạy app
ENTRYPOINT ["java", "-jar", "app.jar"]
