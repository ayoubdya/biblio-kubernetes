pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        DOCKER_NETWORK = 'biblio-network'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building branch: ${env.BRANCH_NAME ?: 'main'}"
            }
        }

        stage('Build Services') {
            parallel {
                stage('Build Catalog Service') {
                    steps {
                        dir('catalog-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Build User Service') {
                    steps {
                        dir('user-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Build Comment Service') {
                    steps {
                        dir('comment-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend-service') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Test Catalog Service') {
                    steps {
                        dir('catalog-service') {
                            sh './mvnw test'
                        }
                    }
                    post {
                        always {
                            junit 'catalog-service/target/surefire-reports/*.xml'
                        }
                    }
                }
                stage('Test User Service') {
                    steps {
                        dir('user-service') {
                            sh './mvnw test'
                        }
                    }
                    post {
                        always {
                            junit 'user-service/target/surefire-reports/*.xml'
                        }
                    }
                }
                stage('Test Comment Service') {
                    steps {
                        dir('comment-service') {
                            sh './mvnw test'
                        }
                    }
                    post {
                        always {
                            junit 'comment-service/target/surefire-reports/*.xml'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def services = ['catalog-service', 'user-service', 'comment-service', 'frontend-service']
                    for (service in services) {
                        dir(service) {
                            sh "docker build -t biblio/${service}:${BUILD_NUMBER} -t biblio/${service}:latest ."
                        }
                    }
                }
            }
        }

        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to development environment...'
                sh 'docker compose -f docker-compose.yml up -d --build catalog-service user-service comment-service frontend-service'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                echo 'Deploying to production environment...'
                sh 'docker compose -f docker-compose.yml up -d --build'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
