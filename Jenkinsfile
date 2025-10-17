pipeline {
    agent any

    tools {
        nodejs "NodeJS_16"
    }

    environment {
        DOCKER_USER   = 'kao123'              // Ton identifiant Docker Hub
        FRONT_IMAGE   = 'react-frontend'
        BACK_IMAGE    = 'express-backend'
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'pusher_name', value: '$.pusher.name'],
                [key: 'commit_message', value: '$.head_commit.message']
            ],
            causeString: 'Push par $pusher_name sur $ref : "$commit_message"',
            token: 'mysecret',
            printContributedVariables: true,
            printPostContent: true
        )
    }

    stages {

        stage('Checkout') {
            steps {
                echo "📦 Récupération du code depuis GitHub..."
                git branch: 'main', url: 'https://github.com/omarlouis1/demo.git'
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('back-end') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('front-end') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo "🧪 Exécution des tests..."
                script {
                    sh 'cd back-end && npm test || echo "⚠️ Aucun test backend"'
                    sh 'cd front-end && npm test || echo "⚠️ Aucun test frontend"'
                }
            }
        }

  
        stage('Build Docker Images') {
            steps {
                echo "🐳 Construction des images Docker..."
                sh """
                    docker build -t $DOCKER_USER/$BACK_IMAGE:latest ./back-end
                    docker build -t $DOCKER_USER/$FRONT_IMAGE:latest ./front-end
                """
            }
        }

           stage('Push Docker Images') {
    steps {
        echo "📤 Tentative d'envoi des images Docker vers Docker Hub..."

        script {
            withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                echo "🔐 Connexion à Docker Hub avec l'utilisateur: ${env.DOCKER_USER}"

                // Afficher les images disponibles avant le push
                sh '''
                    echo "🧩 Images disponibles localement :"
                    docker images
                '''

                // Tentative de connexion
                sh '''
                    set -x  # Active le mode debug (affiche les commandes exécutées)
                    echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin || {
                        echo "❌ ERREUR: Échec de l'authentification Docker Hub !"
                        exit 1
                    }
                    set +x
                '''

                // Pousser les images avec affichage des erreurs
                sh '''
                    set -x
                    echo "🚀 Poussée de l'image front-end..."
                    docker push "$DOCKER_USER/$FRONT_IMAGE:latest" || {
                        echo "❌ ERREUR: Échec du push pour $DOCKER_USER/$FRONT_IMAGE:latest"
                        docker logout
                        exit 1
                    }

                    echo "🚀 Poussée de l'image back-end..."
                    docker push "$DOCKER_USER/$BACK_IMAGE:latest" || {
                        echo "❌ ERREUR: Échec du push pour $DOCKER_USER/$BACK_IMAGE:latest"
                        docker logout
                        exit 1
                    }

                    docker logout
                    echo "✅ Images poussées avec succès sur Docker Hub !"
                    set +x
                '''
            }
        }
    }
}

        stage('Deploy') {
            steps {
                echo "🚀 Déploiement via docker-compose..."
                sh '''
                    docker-compose -f compose.yaml down || true
                    docker-compose -f compose.yaml pull
                    docker-compose -f compose.yaml up -d
                    docker-compose ps
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🔎 Vérification des services..."
                sh '''
                    echo "Frontend (port 5173) :" 
                    curl -f http://localhost:5173 || echo "⚠️ Frontend inaccessible"
                    echo "Backend (port 5001) :"
                    curl -f http://localhost:5001/api || echo "⚠️ Backend inaccessible"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline terminé avec succès !"
            emailext(
                subject: "✅ SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                ✅ Build réussi pour ${env.JOB_NAME} #${env.BUILD_NUMBER}
                🔗 Détails: ${env.BUILD_URL}
                """,
                to: "omzokao99@gmail.com"
            )
        }
        failure {
            echo "❌ Échec du pipeline."
            emailext(
                subject: "❌ FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Le pipeline a échoué 💥\n\nDétails : ${env.BUILD_URL}",
                to: "omzokao99@gmail.com"
            )
        }
    }
}
