# Backend notification — code để Chu đọc và chép

Ngày 22/11/2026. Đây là bản sửa inbox, chưa nối producer nghiệp vụ sang SQS/Lambda. Ba file dưới đã được tạo/sửa ở local trước khi Chu nhắc lại quy tắc Backend chỉ gửi code; chưa commit/push. Không cần dán lại nếu IntelliJ đã có đúng code này. Từ thời điểm nhắc lại, assistant chỉ sửa Frontend và tự thêm/chạy tests.

## 1. Flow và phạm vi

Controller hiện có lấy userId từ principal, không nhận userId do browser gửi. Service query PK của caller, lọc soft-deleted/TTL expired, trả cursor từ LastEvaluatedKey. ID REST encode SK giúp GET/update trực tiếp đúng key mà không scan table hoặc cần GSI mới. ID/token là opaque đối với Frontend; base64 không phải cơ chế bảo mật, kiểm tra PK/caller mới quyết định quyền.

Mark read chỉ ghi readAt lần đầu. Delete là soft delete; restore là API có sẵn, chưa có UI thùng rác. Mọi update có condition để không tự tạo một notification khi ID không tồn tại. DynamoDB lỗi phải trả lỗi thật thay vì inbox rỗng.

Một trang sau filter có thể rỗng nhưng vẫn có LastEvaluatedKey: Frontend phải giữ nút Tải thêm. [AWS Query](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html) mô tả Limit áp dụng trước filter.

## 2. Cấu hình cần có

Không sửa hoặc đưa credentials vào code. Backend dùng AWS default credentials chain (environment/profile/IAM role).

- AWS_REGION: cùng region với table và Lambda, mặc định ap-south-1.
- AWS_DYNAMODB_NOTIFICATIONS_TABLE: tên table mà Backend đọc, mặc định notifications.
- Lambda dùng DYNAMODB_TABLE_NAME: giá trị phải là cùng table Backend.
- Table có PK String (partition) và SK String (sort), đúng schema DynamoDbService của notification-lambda. Không tự tạo/xóa table AWS bằng ứng dụng.
- Backend cần quyền dynamodb:Query, GetItem, UpdateItem cho đúng table. Lambda giữ PutItem của nó.
- aws.dynamodb.endpoint để trống khi dùng AWS; chỉ set URL khi chủ động dùng DynamoDB Local. Test suite dùng container tạm riêng và credentials giả, không ghi AWS.

Thiếu credentials/table/quyền sẽ hiện Không tải được thông báo. Inbox rỗng thành công chỉ có nghĩa là request thành công và không có bản ghi hiển thị, không chứng minh producer đã chạy.

## 3. Các file đầy đủ

Giữ nguyên NotificationController và NotificationPageResponse hiện có. Không thêm endpoint giả, không đổi client auth hay payment.

### config/NotificationDynamoDbConfig.java

```java
package com.moldy.moldymarket.notification.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@Configuration(proxyBeanMethods = false)
public class NotificationDynamoDbConfig {
    @Bean
    @ConditionalOnMissingBean(DynamoDbClient.class)
    DynamoDbClient notificationDynamoDbClient(@Value("${aws.region:ap-south-1}") String region,
            @Value("${aws.dynamodb.endpoint:}") String endpoint) {
        var builder = DynamoDbClient.builder().region(Region.of(region))
                .overrideConfiguration(config -> config.apiCallTimeout(Duration.ofSeconds(8))
                        .apiCallAttemptTimeout(Duration.ofSeconds(3)));
        if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
        return builder.build();
    }
}
```

### dto/NotificationRecord.java

```java
package com.moldy.moldymarket.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationRecord {
    private String id;
    private String userId;
    private String type;
    private String title;
    private String message;
    private String relatedEntityId;
    private String relatedEntityType;
    private boolean read;
    private boolean deleted;
    private Instant createdAt;
    private Instant readAt;
}
```

### service/NotificationService.java

```java
package com.moldy.moldymarket.notification.service;

import com.moldy.moldymarket.common.exception.AppException;
import com.moldy.moldymarket.common.exception.ErrorCode;
import com.moldy.moldymarket.notification.dto.NotificationPageResponse;
import com.moldy.moldymarket.notification.dto.NotificationRecord;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import tools.jackson.databind.ObjectMapper;

@Service
public class NotificationService {
    private static final String PREFIX = "NOTIFICATION#";
    private final DynamoDbClient db;
    private final ObjectMapper json;
    private final String table;

    public NotificationService(DynamoDbClient db, ObjectMapper json,
            @Value("${aws.dynamodb.notifications-table:notifications}") String table) {
        this.db = db;
        this.json = json;
        this.table = table;
    }

    public NotificationPageResponse getPage(String userId, int limit, String token) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        var request = QueryRequest.builder().tableName(table).consistentRead(true).scanIndexForward(false)
                .limit(safeLimit).keyConditionExpression("PK = :pk AND begins_with(SK, :prefix)")
                .filterExpression("attribute_not_exists(deletedAt) AND (attribute_not_exists(expiresAt) OR expiresAt > :now)")
                .expressionAttributeValues(Map.of(":pk", string("USER#" + userId), ":prefix", string(PREFIX),
                        ":now", number(Instant.now().getEpochSecond())));
        if (token != null) request.exclusiveStartKey(cursor(userId, token));
        var result = db.query(request.build());
        String next = null;
        if (result.hasLastEvaluatedKey() && !result.lastEvaluatedKey().isEmpty()) {
            next = encode(json.writeValueAsString(Map.of("userId", userId, "key", result.lastEvaluatedKey().get("SK").s())));
        }
        return NotificationPageResponse.builder().items(result.items().stream().map(item -> record(userId, item)).toList())
                .limit(safeLimit).nextToken(next).hasMore(next != null).build();
    }

    public NotificationRecord getById(String userId, String notificationId) {
        var item = find(userId, decodeId(notificationId));
        if (item.containsKey("deletedAt")) throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        return record(userId, item);
    }

    public void markAsRead(String userId, String notificationId) { update(userId, notificationId, Action.READ); }
    public void softDelete(String userId, String notificationId) { update(userId, notificationId, Action.DELETE); }
    public void restore(String userId, String notificationId) { update(userId, notificationId, Action.RESTORE); }

    private void update(String userId, String id, Action action) {
        String sk = decodeId(id);
        Instant now = Instant.now();
        var values = new HashMap<String, AttributeValue>();
        values.put(":epoch", number(now.getEpochSecond()));
        String expression;
        if (action == Action.READ) {
            expression = "SET isRead = :read, readAt = if_not_exists(readAt, :time)";
            values.put(":read", AttributeValue.builder().bool(true).build());
            values.put(":time", string(now.toString()));
        } else if (action == Action.DELETE) {
            expression = "SET deletedAt = :time";
            values.put(":time", string(now.toString()));
        } else expression = "REMOVE deletedAt";
        String deletionCondition = action == Action.RESTORE ? "attribute_exists(deletedAt)" : "attribute_not_exists(deletedAt)";
        try {
            db.updateItem(UpdateItemRequest.builder().tableName(table).key(key(userId, sk))
                    .updateExpression(expression).expressionAttributeValues(values)
                    .conditionExpression("attribute_exists(PK) AND attribute_exists(SK) AND " + deletionCondition
                            + " AND (attribute_not_exists(expiresAt) OR expiresAt > :epoch)").build());
        } catch (ConditionalCheckFailedException exception) {
            var item = find(userId, sk);
            if (action == Action.DELETE && item.containsKey("deletedAt"))
                throw new AppException(ErrorCode.NOTIFICATION_ALREADY_DELETED);
            if (action == Action.RESTORE && !item.containsKey("deletedAt"))
                throw new AppException(ErrorCode.NOTIFICATION_NOT_DELETED);
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
    }

    private Map<String, AttributeValue> find(String userId, String sk) {
        var item = db.getItem(GetItemRequest.builder().tableName(table).key(key(userId, sk)).consistentRead(true).build()).item();
        if (item.isEmpty() || (item.containsKey("expiresAt")
                && Long.parseLong(item.get("expiresAt").n()) <= Instant.now().getEpochSecond()))
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        return item;
    }

    private NotificationRecord record(String userId, Map<String, AttributeValue> item) {
        return NotificationRecord.builder().id(encode(text(item, "SK"))).userId(userId)
                .type(text(item, "type")).title(text(item, "title")).message(text(item, "content"))
                .relatedEntityId(text(item, "referenceId")).relatedEntityType(text(item, "referenceType"))
                .read(item.containsKey("isRead") && Boolean.TRUE.equals(item.get("isRead").bool()))
                .deleted(item.containsKey("deletedAt")).createdAt(time(item, "createdAt")).readAt(time(item, "readAt")).build();
    }

    private Map<String, AttributeValue> cursor(String userId, String token) {
        String owner, sk;
        try {
            var node = json.readTree(decode(token, 4096));
            if (!node.path("userId").isTextual() || !node.path("key").isTextual()) throw new IllegalArgumentException();
            owner = node.path("userId").asText(); sk = node.path("key").asText();
            validateKey(sk);
        } catch (RuntimeException exception) { throw new AppException(ErrorCode.INVALID_PAGINATION_TOKEN); }
        if (!userId.equals(owner)) throw new AppException(ErrorCode.PAGINATION_TOKEN_USER_MISMATCH);
        return key(userId, sk);
    }

    private static String decodeId(String id) {
        try { String sk = decode(id, 1600); validateKey(sk); return sk; }
        catch (RuntimeException exception) { throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND); }
    }
    private static void validateKey(String sk) {
        if (sk.length() > 1024 || !sk.startsWith(PREFIX)) throw new IllegalArgumentException();
        int separator = sk.indexOf('#', PREFIX.length());
        if (separator < 0 || separator == sk.length() - 1) throw new IllegalArgumentException();
        Instant.parse(sk.substring(PREFIX.length(), separator));
    }
    private static String decode(String value, int max) {
        if (value == null || value.isEmpty() || value.length() > max) throw new IllegalArgumentException();
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }
    private static String encode(String value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8)); }
    private static Map<String, AttributeValue> key(String userId, String sk) { return Map.of("PK", string("USER#" + userId), "SK", string(sk)); }
    private static AttributeValue string(String value) { return AttributeValue.builder().s(value).build(); }
    private static AttributeValue number(long value) { return AttributeValue.builder().n(Long.toString(value)).build(); }
    private static String text(Map<String, AttributeValue> item, String name) { return item.containsKey(name) ? item.get(name).s() : null; }
    private static Instant time(Map<String, AttributeValue> item, String name) { String value = text(item, name); return value == null ? null : Instant.parse(value); }
    private enum Action { READ, DELETE, RESTORE }
}
```

## 4. Cách đọc code

- Config chỉ tạo DynamoDbClient, region/endpoint lấy từ cấu hình; SDK tự lấy credentials, không hard-code.
- getPage tạo Query theo USER#caller, thứ tự SK giảm dần, mỗi request chỉ một query có limit 1–50.
- record chuyển field storage content/isRead/referenceId sang message/read/relatedEntityId của DTO. Instant serialize có timezone UTC.
- cursor kiểm tra cấu trúc và ràng buộc userId; ID của tài khoản khác luôn tìm trong PK caller nên trả 404.
- update dùng conditional write. Khi condition thất bại, find giúp phân biệt missing/expired và trạng thái xóa không hợp lệ; lỗi AWS khác giữ nguyên để handler trả lỗi server.
- SK dùng chuỗi Instant theo producer hiện có. Không migrate format/đổi Lambda ở bước này; các event cùng giây với độ chính xác timestamp khác nhau có thể không có thứ tự tuyệt đối theo nanosecond.

## 5. Kiểm chứng

Lượt kiểm tra 22/11: Backend Maven verify/package thành công, 319 tests (318 pass, 1 disabled có sẵn); Frontend format/lint/format:check/build thành công, 51 test files / 465 tests pass. Chưa kiểm thử giao diện bằng trình duyệt hoặc AWS pipeline thật.

Integration test đã thêm tự động: Backend src/test/java/com/moldy/moldymarket/notification/NotificationInboxIntegrationTest.java. Năm tests dùng HTTP/JWT/PostgreSQL thật và DynamoDB Local Testcontainer: list/cursor/caller; trang lọc rỗng còn cursor; đọc/xóa/restore lưu thật; ID ngoại và missing không được ghi; guest/token hỏng/expired bị từ chối. Không gửi thông báo/email thật.

Frontend: đăng nhập → Thông báo (/notifications) → Làm mới/Tải thêm → đánh dấu đọc → xóa có xác nhận. Logout/login tài khoản khác không được lộ dữ liệu cũ. Không cần xóa giỏ/đặt tiền thật để test inbox.

## 6. Phần chưa làm

Chưa xác minh AWS SQS → Lambda → DynamoDB trên tài khoản của Chu. Chưa tìm thấy nơi main app tạo NotificationEvent; cần chọn một trigger nghiệp vụ cụ thể rồi gửi tiếp Backend code để Chu chép. Không kỳ vọng chỉ mở UI là đặt hàng sẽ tự sinh thông báo. Không phát event thử giả trên tài khoản thật.
