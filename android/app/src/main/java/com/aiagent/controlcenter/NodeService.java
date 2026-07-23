package com.aiagent.controlcenter;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 后台服务 - 完全隐藏运行环境
 */
public class NodeService extends Service {
    
    private static final String TAG = "ControlCenter";
    private static final String CHANNEL_ID = "control_center_service";
    private static final int NOTIFICATION_ID = 1;
    
    private Process nodeProcess;
    private Thread outputThread;
    private boolean isRunning = false;
    
    // 内部路径（对用户不可见）
    private File envRoot;
    private File nodeBin;
    private File appDir;
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initPaths();
    }
    
    private void initPaths() {
        // 使用隐藏的内部存储路径
        envRoot = new File(getFilesDir(), ".env");
        nodeBin = new File(envRoot, "bin/node");
        appDir = new File(getFilesDir(), ".app");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "服务启动");
        
        // 创建最小化通知（不显示技术细节）
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);
        
        // 后台初始化
        new Thread(() -> {
            try {
                // 1. 解压运行环境
                extractRuntime();
                
                // 2. 解压应用
                extractApp();
                
                // 3. 设置权限
                setupPermissions();
                
                // 4. 启动服务
                startService();
                
            } catch (Exception e) {
                Log.e(TAG, "启动失败", e);
                stopSelf();
            }
        }).start();
        
        return START_STICKY;
    }
    
    /**
     * 解压运行环境（完全静默）
     */
    private void extractRuntime() throws Exception {
        File marker = new File(envRoot, ".ready");
        if (marker.exists()) {
            return;
        }
        
        Log.d(TAG, "初始化环境...");
        
        // 从 assets 解压运行时
        File runtimeZip = new File(getCacheDir(), ".runtime");
        extractAssetFile("runtime/runtime.zip", runtimeZip);
        
        // 解压到隐藏目录
        if (!envRoot.exists()) {
            envRoot.mkdirs();
        }
        
        // 使用 unzip 解压
        ProcessBuilder pb = new ProcessBuilder(
            "unzip", "-o", "-q",
            runtimeZip.getAbsolutePath(),
            "-d", envRoot.getAbsolutePath()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        int exitCode = process.waitFor();
        
        if (exitCode != 0) {
            throw new Exception("环境初始化失败");
        }
        
        // 清理临时文件
        runtimeZip.delete();
        
        // 创建标记
        marker.createNewFile();
        
        Log.d(TAG, "环境就绪");
    }
    
    /**
     * 解压应用
     */
    private void extractApp() throws Exception {
        File marker = new File(appDir, ".ready");
        if (marker.exists()) {
            return;
        }
        
        Log.d(TAG, "加载应用...");
        
        if (!appDir.exists()) {
            appDir.mkdirs();
        }
        
        extractAssetFolder("app", getFilesDir());
        
        marker.createNewFile();
        
        Log.d(TAG, "应用就绪");
    }
    
    /**
     * 设置权限
     */
    private void setupPermissions() throws Exception {
        // 设置可执行权限
        nodeBin.setExecutable(true);
        
        File binDir = new File(envRoot, "bin");
        if (binDir.exists()) {
            File[] files = binDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    file.setExecutable(true);
                }
            }
        }
    }
    
    /**
     * 启动服务
     */
    private void startService() throws Exception {
        Log.d(TAG, "启动服务...");
        
        // 构建环境变量
        Map<String, String> env = new HashMap<>();
        env.put("PATH", envRoot.getAbsolutePath() + "/bin");
        env.put("LD_LIBRARY_PATH", envRoot.getAbsolutePath() + "/lib");
        env.put("HOME", getFilesDir().getAbsolutePath());
        env.put("TMPDIR", getCacheDir().getAbsolutePath());
        env.put("PORT", "3000");
        
        // 启动进程
        ProcessBuilder pb = new ProcessBuilder(
            nodeBin.getAbsolutePath(),
            new File(appDir, "server.js").getAbsolutePath()
        );
        
        pb.directory(appDir);
        pb.environment().putAll(env);
        pb.redirectErrorStream(true);
        
        nodeProcess = pb.start();
        isRunning = true;
        
        Log.d(TAG, "服务已启动");
        
        // 读取输出（静默）
        outputThread = new Thread(() -> {
            try {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(nodeProcess.getInputStream())
                );
                String line;
                while ((line = reader.readLine()) != null) {
                    // 只记录错误
                    if (line.contains("ERROR") || line.contains("error")) {
                        Log.e(TAG, line);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "读取输出错误", e);
            }
        });
        outputThread.start();
        
        // 等待进程
        int exitCode = nodeProcess.waitFor();
        Log.d(TAG, "服务退出: " + exitCode);
        isRunning = false;
        
        // 异常退出自动重启
        if (exitCode != 0) {
            Log.w(TAG, "服务异常，正在重启...");
            Thread.sleep(3000);
            startService();
        }
    }
    
    private void extractAssetFolder(String assetPath, File destDir) throws Exception {
        String[] files = getAssets().list(assetPath);
        
        if (files.length == 0) {
            extractAssetFile(assetPath, new File(destDir, assetPath));
        } else {
            File dir = new File(destDir, assetPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            for (String file : files) {
                extractAssetFolder(assetPath + "/" + file, destDir);
            }
        }
    }
    
    private void extractAssetFile(String assetPath, File destFile) throws Exception {
        if (destFile.exists()) {
            return;
        }
        
        destFile.getParentFile().mkdirs();
        
        InputStream in = getAssets().open(assetPath);
        OutputStream out = new FileOutputStream(destFile);
        
        byte[] buffer = new byte[8192];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        
        in.close();
        out.flush();
        out.close();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "AI Agent 中控台",
                NotificationManager.IMPORTANCE_MIN  // 最小化通知
            );
            channel.setShowBadge(false);
            channel.enableLights(false);
            channel.enableVibration(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AI Agent 中控台")
            .setContentText("服务运行中")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_MIN)  // 最低优先级
            .setOngoing(true)
            .setShowWhen(false)
            .build();
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        stopService();
        Log.d(TAG, "服务停止");
    }
    
    private void stopService() {
        if (nodeProcess != null) {
            nodeProcess.destroy();
            try {
                nodeProcess.waitFor();
            } catch (InterruptedException e) {
                Log.e(TAG, "停止服务错误", e);
            }
            nodeProcess = null;
        }
        isRunning = false;
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
